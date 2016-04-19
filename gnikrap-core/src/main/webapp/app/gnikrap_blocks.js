/*
 * Gnikrap is a simple scripting environment for the Lego Mindstrom EV3
 * Copyright (C) 2015 Jean BENECH
 *
 * Gnikrap is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gnikrap is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Gnikrap.  If not, see <http://www.gnu.org/licenses/>.
 */


// Blockly integration/usage choice
//  * Javascript generation in 2 phases
//    A first phase driven by blockly will generate a Javascript that is
//    runnable on the EV3 but not optimized and 'false' for the motor type to use.
//    A second phase will post-process this code (mainly with regexp) in order
//    to have a fully 'true' and optimized Javascript code.
//
//    This choice has been made because:
//     - It is difficult to find the 'good' way to do it in Blockly (very light documentation on this topic).
//     - When trying to do it, we end up by using methods/fields beginning or ending with  '_'.
//       The documentation state that these methods should be considered as private/unstable, so it's
//       not an optimal option.
//     - The only clean way to achieve it seems to (re-)write all the code generation for a whole new
//       language eg. 'GnikrapJS' => This is too much work for the expected benefit.
//     - PostProcessing is the simplest and straightforward way to implement it.
//
//  * User program verification/validation is done in real time at the workspace level - complexity 0(n).
//     - Warning are displayed on the blocks to help the users
//       Note: Don't perform the checks at the block level as it lead to a complexity 0(n2) as described in the
//             block factory sample.
//    Verification/validation is also done in the Javascript code post-processing phase.
//     - Some case will emit warning, some other will emit errors that will block the script to be sent to the EV3 brick.


// Define utils function for blockly
function GnikrapBlocks() {
  'use strict';

  var self = this;
  { // Init
     // Make Blockly more flashy
    Blockly.HSV_SATURATION = 0.70;
    Blockly.HSV_VALUE = 0.65;

    self.XSENSOR_MAGIC = '@XSensorValue@';

    self.workspace = undefined; // Useless, already to undefined here :-)
  }

  // Return the name of the Blockly translation file according to the given language
  self.__getBlocklyTranslationJs = function(language) {
    return "lib/blockly-20160417/msg/js/<LANGUAGE>.js".replace("<LANGUAGE>", language);
  };

  // Returns the current workspace
  self.__getWorkspace = function() {
    if(self.workspace) {
      return self.workspace;
    } else {
      console.log("WARNING: Workspace should be initialized... returning default main workspace !");
      return Blockly.mainWorkspace;
    }
  };

  // Check the blocks each time something change in the Blockly workspace
  self.__checkBlocks = function() {
    var ev3Ports = {}; // key: port, value: { type1: [listOfBlocks], type2: [listOfBlocks] }
    var motorType = {}; // key: port, value: motorType
    var motorBlocks = {}; // key: port, value: [listOfMotorsBlock]

    self.__getWorkspace().getAllBlocks().forEach(function(block) {
        if(block.getEV3PortData && !block.disabled && !block.getInheritedDisabled()) {
          var data = block.getEV3PortData();

          if(data.action == "useMotor") { // Block using a motor
            if(!motorBlocks[data.port]) {
              motorBlocks[data.port] = [];
            }
            motorBlocks[data.port].push(block);
          } else { // Not using a motor
            if(!ev3Ports[data.port]) {
              ev3Ports[data.port] = {};
            }
            var temp = ev3Ports[data.port];
            if(!temp[data.type]) {
              temp[data.type] = [];
            }
            temp[data.type].push(block);

            if(data.action == "setMotorType") { // Defining motor type
              if(!motorType[data.port]) {
                motorType[data.port] = data.type;
              } // else: Don't check if motor type already defined, the check is already done in ev3Ports
            }
          }
        }
      });

    // Check if some port have 2 different types
    for(var port in ev3Ports) {
      var sensorsForPort = ev3Ports[port];
      var isMotor = port.match(/[A-D]/);
      var flag = (Object.keys(sensorsForPort).length > 1)
          ? (isMotor ? i18n.t("blocks.errors.blockTwoDifferentMotorsOnTheSamePort") : i18n.t("blocks.errors.blockTwoDifferentSensorsOnTheSamePort"))
          : null;
      for(var sensorType in sensorsForPort) {
        sensorsForPort[sensorType].forEach(function(block) {
            block.setWarningText(flag);
          });
      }
    }

    // For motors, check if the motor-type has been defined
    for(var port in motorBlocks) {
      var flag = (motorType[port] ? null : i18n.t("blocks.errors.blockNeedToDefineMotorType"));
      motorBlocks[port].forEach(function(block) {
          block.setWarningText(flag);
        });
    }
  };

  // Inject Blockly in the given DOM element
  self.injectInDOM = function(domElement, language) {
    self.__createBlocksForGnikrap();

    // Load the Blockly expected translation file
    var jsFilename = self.__getBlocklyTranslationJs(language);
    var initWorkspace = function() {
      self.workspace = Blockly.inject(domElement, 
          { toolbox: self.__generateXmlToolboxTree() /* ,
            grid: {
              spacing: 20,
              length: 3,
              colour: '#ccc',
              snap: true } */
          });
      self.workspace.addChangeListener(self.__checkBlocks); // Used to set the nodes to warning if needed
      /*
      self.loadXML(
          '<xml><block type="controls_whileUntil" deletable="false" x="70" y="70">' +
          '  <value name="BOOL"><block type="gnikrap_ev3_isok" deletable="false"></block></value>' +
          '</block></xml>');
      */
    };

    $.getScript(jsFilename).done(initWorkspace)
      .fail(function(jqxhr, settings, exception) {
        console.log("WARNING: Fail to load javascript file: '" + jsFilename + "' with error: " + exception);
        initWorkspace();
      });
  };

  // Update the language used by Blockly to the given language
  self.updateLanguage = function(language) {
    // Translation of Gnikrap block will be automatic (next call to i18n will do the job)
    // Translation of Blockly blocks need to load the appropriate JS file
    // The toolbox have to be closed. It will be automatically translated at the next use
    // The blocks already created have to be recreated in order to be translated
    if(!self.workspace) {
      console.log("WARNING: Blockly not initialized, workspace cannot be translated to another language");
      return;
    }
    
    // Load again the Blockly language JS (Seems that Blockly JSON files are used at 'compilation' time only)    
    var jsFilename = self.__getBlocklyTranslationJs(language);
    var workspace = self.__getWorkspace();
    $.getScript(jsFilename).done(function(script, textStatus ) {
      // Recreate blocks on workspace
      var xml = Blockly.Xml.workspaceToDom(workspace);
      workspace.clear();
      Blockly.Xml.domToWorkspace(workspace, xml);
      workspace.updateToolbox(self.__generateXmlToolboxTree());
    }).fail(function(jqxhr, settings, exception) {
      // Does nothing, blocks will stay in previous language
      console.log("Fail to load javascript file: '" + jsFilename + "' with error: " + exception);
      workspace.updateToolbox(self.__generateXmlToolboxTree());
    });
  };

  // Note can throw exception if XML isn't valid
  self.loadXML = function(xml) {
    var xml = Blockly.Xml.textToDom(xml);
    Blockly.Xml.domToWorkspace(self.__getWorkspace(), xml);
  }
  
  // Clear the current script
  self.clear = function() {
    self.__getWorkspace().clear();
  };

  // Return an object containing the code generated and the list of error/warning if any
  self.buildJavascriptCode = function() {
    var code = "\n" + Blockly.JavaScript.workspaceToCode(self.__getWorkspace());
    var result = { errors: [], warnings: [] };

    // Build the list of motor types
    var motorTypes = {}; // Key: port, value: getXxxMotor function name
    code = code.replace(/"@setMotorType\(([A-D]), ([A-Za-z]+)\)";/g, function(match, p1, p2) {
        if(motorTypes[p1]) {
          if(motorTypes[p1] != p2) {
            result.errors.push(i18n.t("blocks.errors.compilePortWithSeveralMotorType", { port: p1}));
          }
        } else {
          motorTypes[p1] = p2;
        }
        return "/* The motor on port " + p1 + " will be set to '" + p2 + "' */"; // Discard the motor type definition line
      });

    // Build the list of devices connected to the EV3 ports
    var ev3Ports = {}; // Key: port, value: [varName, getter ]
    [ [/ev3\.getBrick\(\).getTouchSensor\("([1-4])"\)/g, 'ev3TouchSensor'],
      [/ev3\.getBrick\(\).getColorSensor\("([1-4])"\)/g, 'ev3ColorSensor'],
      [/ev3\.getBrick\(\).getIRSensor\("([1-4])"\)/g, 'ev3IRSensor'],
      [/ev3\.getBrick\(\)\.getLargeMotor\("([A-D])"\)/g, 'ev3Motor']
    ].forEach(function(value) {
        code = code.replace(value[0], function(match, p1) {
            // Check if the port is not already used by another device and register it if new
            var varInfo = [];
            var isMotor = p1.match(/[A-D]/);
            if(isMotor) {
              if(!motorTypes[p1]) {
                motorTypes[p1] = 'getLargeMotor'; // Default to large motor
                result.warnings.push(i18n.t("blocks.errors.compileMotorTypeNotDefineFor", { port: p1}));
              }
              varInfo[1] = match.replace('getLargeMotor', motorTypes[p1]);
            } else {
              varInfo[1] = match;
            }
            if(ev3Ports[p1]) {
              if(ev3Ports[p1][1] != varInfo[1]) {
                result.errors.push(i18n.t("blocks.errors.compilePortUsedForSeveralSensor", { port: p1}));
                return match;
              }
            } else {
              varInfo[0] = Blockly.JavaScript.variableDB_.getDistinctName("ev3Port_" + p1);
              ev3Ports[p1] = varInfo;
            }
            return ev3Ports[p1][0];
          });
      });

    // Add in the code the associated variables
    for(var p in ev3Ports) {
      code = "var " + ev3Ports[p][0] + " = " + ev3Ports[p][1] + ';\n' + code;
    }

    // Other simple replace (for better Javascript execution performances)
    [ [/ev3.getBrick\(\).getKeyboard\(\)/g, Blockly.JavaScript.variableDB_.getDistinctName('ev3Keyboard'), 'ev3.getBrick().getKeyboard()'],
      [/ev3.getBrick\(\).getLED\(\)/g, Blockly.JavaScript.variableDB_.getDistinctName('ev3LED'), 'ev3.getBrick().getLED()'],
      [/ev3.getBrick\(\).getSound\(\)/g, Blockly.JavaScript.variableDB_.getDistinctName('ev3Sound'), 'ev3.getBrick().getSound()']
    ].forEach(function(value) {
        var varName = value[1];
        var newCode = code.replace(value[0], varName);
        if(newCode.length != code.length) {
          code = 'var ' + varName + ' = ' + value[2] + ';\n' + newCode;
        }
      });

    // Check for xSensor (all XSENSOR_MAGIC should have been replaced)
    if(code.indexOf(self.XSENSOR_MAGIC) != -1) {
      result.errors.push(i18n.t("blocks.errors.compileXSensorMustBeInsideWithxSensorDo"));
    }

    result.code = code;
    return result;
  };

  // Expected block: {type: xxx, xmlContent: xxx }
  self.__blockToXML = function(block) {
    return '<block type="' + block.type + '">' +
        (block.xmlContent ? block.xmlContent : '') +
        '</block>';
  };

  self.__generateBlocklyCategories = function() {
    var xml = [ ];
    // Logic
    xml.push('<category id="catLogic" name="' + i18n.t("blocks.categories.logic") + '">');
    xml.push([
          {type: "controls_if"},
          {type: "controls_if",
            xmlContent: '<mutation else="1"></mutation>' },
          {type: "logic_compare"},
          {type: "logic_operation"},
          {type: "logic_negate"},
          {type: "logic_boolean"}
        ].map(self.__blockToXML).join(''));
    // Other existing blocks: logic_null, logic_ternary
    xml.push('</category>');

    // Loop
    xml.push('<category id="catLoops"  name="' + i18n.t("blocks.categories.loops") + '">');
    xml.push([
          {type: "controls_repeat_ext",
            xmlContent: '<value name="TIMES"><block type="math_number"><field name="NUM">10</field></block></value>'},
          {type: "controls_whileUntil"},
          {type: "controls_whileUntil",
            xmlContent: '<value name="BOOL"><block type="gnikrap_ev3_isok"></block></value>'},
          {type: "controls_forEach"}
        ].map(self.__blockToXML).join(''));
    // Other existing blocks: controls_for, controls_flow_statements
    xml.push('</category>');

    // Math
    xml.push('<category id="catMath" name="' + i18n.t("blocks.categories.math") + '">');
    xml.push([
          {type: "math_number"},
          {type: "math_arithmetic"},
          {type: "math_number_property"},
          {type: "math_constrain",
            xmlContent: '<value name="LOW"><block type="math_number"><field name="NUM">1</field></block></value>' +
              '<value name="HIGH"><block type="math_number"><field name="NUM">100</field></block></value>'},
          {type: "math_random_int",
            xmlContent: '<value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>' +
              '<value name="TO"><block type="math_number"><field name="NUM">100</field></block></value>'},
          {type: "math_modulo"},
          {type: "math_single"},
          {type: "math_round"},
          {type: "math_on_list"}
        ].map(self.__blockToXML).join(''));
    // Other existing blocks: math_trig, math_constant, math_change, math_random_float
    xml.push('</category>');

    // Text
    xml.push('<category id="catText" name="' + i18n.t("blocks.categories.text") + '">');
    xml.push([
          {type: "text"},
          {type: "text_join"},
          {type: "text_length"},
          {type: "text_isEmpty"},
          {type: "text_charAt",
            xmlContent: '<value name="VALUE"><block type="variables_get"><field name="VAR" class="textVar">text</field></block></value>' +
              '<value name="AT"><block type="math_number"><field name="NUM">0</field></block></value>'}
        ].map(self.__blockToXML).join(''));
    // other existing blocks: text_append, text_indexOf, text_getSubstring, text_changeCase, text_trim, text_print, text_prompt_ext
    xml.push('</category>');

    // Lists
    xml.push('<category id="catLists" name="' + i18n.t("blocks.categories.lists") + '">');
    xml.push([
          {type: "lists_create_empty"},
          {type: "lists_create_with"},
          {type: "lists_length"},
          {type: "lists_isEmpty"},
          {type: "lists_indexOf",
            xmlContent: '<value name="VALUE"><block type="variables_get"><field name="VAR" class="listVar">list</field></block></value>'},
          {type: "lists_getIndex",
            xmlContent: '<value name="VALUE"><block type="variables_get"><field name="VAR" class="listVar">list</field></block></value>'},
          {type: "lists_setIndex",
            xmlContent: '<value name="LIST"><block type="variables_get"><field name="VAR" class="listVar">list</field></block></value>'},
          {type: "lists_getSublist",
            xmlContent: '<value name="LIST"><block type="variables_get"><field name="VAR" class="listVar">list</field></block></value>'}
        ].map(self.__blockToXML).join(''));
    // other existing blocks: lists_repeat, list-split
    xml.push('</category>');

    return xml.join('');
  };

  self.__generateGnikrapCategories = function() {
    var xml = [];

    xml.push('<category name="' + i18n.t("blocks.categories.ev3_brick") + '">');
    xml.push([
          {type: "gnikrap_ev3_notify"},
          {type: "gnikrap_ev3_wait_until"},
          {type: "gnikrap_ev3_sleep",
            xmlContent: '<value name="TIME"><block type="math_number"><field name="NUM">100</field></block></value>' },
          {type: "gnikrap_ev3_stop"},
          {type: "gnikrap_ev3_isok"},
//          {type: "controls_whileUntil",
//            xmlContent: '<value name="BOOL"><block type="gnikrap_ev3_isok"></block></value>'},
          {type: "gnikrap_ev3_led"},
          {type: "gnikrap_ev3_sound_setvolume",
            xmlContent: '<value name="VOL"><block type="math_number"><field name="NUM">70</field></block></value>' },
          {type: "gnikrap_ev3_sound_beep" },
          {type: "gnikrap_ev3_sound_playnote",
            xmlContent: '<value name="NOTE"><block type="text"><field name="TEXT">Do</field></block></value>' +
                        '<value name="DURATION"><block type="math_number"><field name="NUM">100</field></block></value>' },
          {type: "gnikrap_ev3_keyboard_wait"},
          {type: "gnikrap_ev3_keyboard_ispressed"}
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');

    xml.push('<category name="' + i18n.t("blocks.categories.color_sensor") + '">');
    xml.push([
          {type: "gnikrap_ev3_colorsensor_reflected"},
          {type: "gnikrap_ev3_colorsensor_ambient"},
          {type: "gnikrap_ev3_colorsensor_getcolor"},
          {type: "gnikrap_ev3_colorsensor_iscolor"}
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');
    xml.push('<category name="' + i18n.t("blocks.categories.ir_sensor") + '">');
    xml.push([
          {type: "gnikrap_ev3_irsensor_setchannel"},
          {type: "gnikrap_ev3_irsensor_getdistance"},
          {type: "gnikrap_ev3_irsensor_getremotecommand"}
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');
    xml.push('<category name="' + i18n.t("blocks.categories.touch_sensor") + '">');
    xml.push([
          {type: "gnikrap_ev3_touchsensor_pushed"}
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');

    xml.push('<category name="' + i18n.t("blocks.categories.motors") + '">');
    xml.push([
          {type: "gnikrap_ev3_motor_settype"},
          {type: "gnikrap_ev3_motor_move"},
          {type: "gnikrap_ev3_motor_rotate",
            xmlContent: '<value name="VALUE"><block type="math_number"><field name="NUM">180</field></block></value>' },
          {type: "gnikrap_ev3_motor_setspeed",
            xmlContent: '<value name="SPEED"><block type="math_number"><field name="NUM">75</field></block></value>'},
          {type: "gnikrap_ev3_motor_getspeed"},
          {type: "gnikrap_ev3_motor_ismoving"},
          {type: "gnikrap_ev3_motor_resettacho"},
          {type: "gnikrap_ev3_motor_gettacho"}
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');

    xml.push('<category name="' + i18n.t("blocks.categories.xSensors") + '">');
    xml.push([
          {type: "gnikrap_ev3_xsensor_workwith"},
          {type: "gnikrap_ev3_xgyro_getvalue"},
          {type: "gnikrap_ev3_xgeo_getvalue"},
          {type: "gnikrap_ev3_xvideo_containsobject",
            xmlContent: '<value name="OBJECT_NAME"><block type="text"><field name="TEXT">abc</field></block></value>' },
          {type: "gnikrap_ev3_xvideo_getvalue",
            xmlContent: '<value name="OBJECT_NAME"><block type="text"><field name="TEXT">abc</field></block></value>' },
          {type: "gnikrap_ev3_xtouch_istouchpressed",
            xmlContent: '<value name="TOUCH_NAME"><block type="text"><field name="TEXT">abc</field></block></value>' }
        ].map(self.__blockToXML).join(''));
    xml.push('</category>');

    return xml.join('');
  };

  self.__generateMagicCategories = function() {
    var xml = [];
    xml.push('<category name="' + i18n.t("blocks.categories.variables") + '" custom="VARIABLE"></category>');
    xml.push('<category name="' + i18n.t("blocks.categories.functions") + '" custom="PROCEDURE"></category>');
    return xml.join('');
  };

  self.__generateXmlToolboxTree = function() {
    // Very simple XML => Generate with string concatenation
    var xml = [ '<xml>' ];

    xml.push(self.__generateGnikrapCategories());
    xml.push('<sep></sep>');
    xml.push(self.__generateBlocklyCategories());
    xml.push('<sep></sep>');
    xml.push(self.__generateMagicCategories());

    xml.push('</xml>');
    return xml.join('');
  };

  // Function (a bit long :-) ) that create all the blocks needed for Gnikrap
  self.__createBlocksForGnikrap = function() {
    var EV3_COLOR_SENSOR_COLOUR = 0;
    var EV3_IR_SENSOR_COLOUR = 25;
    var EV3_TOUCH_SENSOR_COLOUR = 50;
    var EV3_KEYBOARD_COLOUR = 225; // 75;
    var XSENSOR_COLOUR = 100;
    var EV3_BRICK_COLOUR = 225;
    var EV3_MOTOR_COLOUR = 275;

    // Init some fields that we want on all blocks
    function initBlock(block, baseKey, colour) {
      // block.setHelpUrl(i18n.t(baseKey + ".helpUrl"));
      block.setTooltip(i18n.t(baseKey + ".tooltip"));
      block.setColour(colour);
    }

    // Init blocks that are stackable (previous and next statement
    function initBlockStackable(block, baseKey, colour) {
      initBlock(block, baseKey, colour);
      block.setPreviousStatement(true);
      block.setNextStatement(true);
    }

    // Init blocks that return something
    function initBlockWithOutput(block, baseKey, colour, outputType) {
      initBlock(block, baseKey, colour);
      block.setOutput(true, outputType);
    }

    // Build a mapper to translate a list of thing with format: [[key, ...], ...]
    function createListForFieldDropdownMapper(translateKey) {
      return function(item) {
        return [ i18n.t(translateKey + "." + item[0]), item[0] ];
      }
    };

    // Look for code in a list with format: [[key, code, ...], ...]
    function getCodeForList(list, key) {
      for(var i = 0; i < list.length; i++) {
        if(list[i][0] == key) {
          return list[i][1];
        }
      }
      return list[0][1]; // Default to 1st item of the list (Should never be triggered)
    };

    /////////////////////////////////////////////////////////////////////////////
    // EV3 object API
    var TIME_UNIT = [["MS"], ["S"]]; // No need of javascript code

    // notify(String): void
    Blockly.Blocks['gnikrap_ev3_notify'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_notify", EV3_BRICK_COLOUR);
        this.appendValueInput("TEXT")
            .appendField(i18n.t("blocks.gnikrap_ev3_notify.text_notify"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_notify'] = function(block) {
      var text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC)
                 || "''"; // Default value if no args

      return 'ev3.notify(' + text + ');\n';
    };

    // isOK(): boolean
    Blockly.Blocks['gnikrap_ev3_isok'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_isok", EV3_BRICK_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_isok.text_ev3_is_ok"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_isok'] = function(block) {
      var code = 'ev3.isOk()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // stop(): boolean
    Blockly.Blocks['gnikrap_ev3_stop'] = {
      init: function() {
        initBlock(this, "blocks.gnikrap_ev3_stop", EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_stop.text_stop_script"));
        this.setPreviousStatement(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_stop'] = function(block) {
      return 'ev3.exit()';
    };

    // wait until
    Blockly.Blocks['gnikrap_ev3_wait_until'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_wait_until", EV3_BRICK_COLOUR);
        this.appendValueInput("UNTIL")
            .setCheck("Boolean")
            .appendField(i18n.t("blocks.gnikrap_ev3_wait_until.text_wait_until"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_wait_until'] = function(block) {
      var until = Blockly.JavaScript.valueToCode(block, 'UNTIL', Blockly.JavaScript.ORDER_ATOMIC) 
                  || 'true'; // Default value if no args

      return 'while(ev3.isOk() && !' + until + ') ev3.sleep(1);\n';
    };
    
    // sleep(int): void
    Blockly.Blocks['gnikrap_ev3_sleep'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_sleep", EV3_BRICK_COLOUR);
        this.appendValueInput("TIME")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sleep.text_sleep"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(TIME_UNIT.map(createListForFieldDropdownMapper("blocks.list_time_unit"))), "TIME_UNIT");
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sleep'] = function(block) {
      var time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC)
                 || 0; // Default value if no args
      var time_unit = block.getFieldValue('TIME_UNIT');

      return 'ev3.sleep(' + (time_unit == 'S' ? (time * 1000) : time) + ');\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // LED object API
    var CHANGE_LED_STATUS = [
        ["OFF", "off()"],
        ["GREEN", "lightGreen()"],
        ["GREEN_1", "lightGreen().blink()"],
        ["GREEN_2", "lightGreen().blink().blink()"],
        ["ORANGE", "lightOrange()"],
        ["ORANGE_1", "lightOrange().blink()"],
        ["ORANGE_2", "lightOrange().blink().blink()"],
        ["RED", "lightRed()"],
        ["RED_1", "lightRed().blink()"],
        ["RED_2", "lightRed().blink().blink()"]];

    Blockly.Blocks['gnikrap_ev3_led'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_led", EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                CHANGE_LED_STATUS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_led.list_change_LED_status"))), "STATUS");
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_led'] = function(block) {
      var status = block.getFieldValue('STATUS');

      return 'ev3.getBrick().getLED().' + getCodeForList(LED_STATUS, status) + ';\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // Sound object API

    // setVolume(int): void
    Blockly.Blocks['gnikrap_ev3_sound_setvolume'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_sound_setvolume", EV3_BRICK_COLOUR);
        this.appendValueInput("VOL")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_setvolume.text_set_volume"));
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_setvolume'] = function(block) {
      var vol = Blockly.JavaScript.valueToCode(block, 'VOL', Blockly.JavaScript.ORDER_ATOMIC)
                || 0; // Default value if no args

      return 'ev3.getBrick().getSound().setVolume(' + vol + ');\n';
    };

    // beep()
    Blockly.Blocks['gnikrap_ev3_sound_beep'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_sound_beep", EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_beep.text_beep"));
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_beep'] = function(block) {
      return 'ev3.getBrick().getSound().beep();\n';
    };

    // playNote(string, int): void
    Blockly.Blocks['gnikrap_ev3_sound_playnote'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_sound_playnote", EV3_BRICK_COLOUR);
        this.appendValueInput("NOTE")
            .setCheck("String")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_playnote.text_play_note"));
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_playnote.text_for"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(TIME_UNIT.map(createListForFieldDropdownMapper("blocks.list_time_unit"))), "TIME_UNIT");
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_playnote'] = function(block) {
      var note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC);
                 || "''"; // Default value if no args
      var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC)
                     || 0; // Default value if no args
      var time_unit = block.getFieldValue('TIME_UNIT');

      // " " are included in the string value
      return 'ev3.getBrick().getSound().playNote(' + note + ', ' +
          (time_unit == 'S' ? (duration * 1000) : duration) + ');\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // Touch sensor API

    Blockly.Blocks['gnikrap_ev3_touchsensor_pushed'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_touchsensor_pushed", EV3_TOUCH_SENSOR_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT")
            .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_is_pushed"));
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'TouchSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_touchsensor_pushed'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getTouchSensor("' + port + '").isPushed()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Color sensor API

    // getReflectedLight(): float
    Blockly.Blocks['gnikrap_ev3_colorsensor_reflected'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_colorsensor_reflected", EV3_COLOR_SENSOR_COLOUR, "Number");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.text_reflected_light") )
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_colorsensor_reflected'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getColorSensor("' + port + '").getReflectedLight()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // getAmbientLight(): float
    Blockly.Blocks['gnikrap_ev3_colorsensor_ambient'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_colorsensor_ambient", EV3_COLOR_SENSOR_COLOUR, "Number");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.text_ambiant_light"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_colorsensor_ambient'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getColorSensor("' + port + '").getAmbientLight()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // getColor(): String
    Blockly.Blocks['gnikrap_ev3_colorsensor_getcolor'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_colorsensor_getcolor", EV3_COLOR_SENSOR_COLOUR, "String");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.text_color"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_colorsensor_getcolor'] = function(block) {
      var port = block.getFieldValue('PORT');
      var code = 'ev3.getBrick().getColorSensor("' + port + '").getColor().getColorAsText()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // isColor(color): boolean
    var COLORS = [
        ["BLACK", "isBlack()"],
        ["BLUE", "isBlue()"],
        ["YELLOW", "isYellow()"],
        ["RED", "isRed()"],
        ["WHITE", "isWhite()"],
        ["BROWN", "isBrown()"],
        ["NONE", "isNoColor()"]];

    Blockly.Blocks['gnikrap_ev3_colorsensor_iscolor'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_colorsensor_iscolor", EV3_COLOR_SENSOR_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                COLORS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_colorsensor_iscolor.list_colors_detected"))), "COLOR")
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_colorsensor_iscolor'] = function(block) {
      var color = block.getFieldValue('COLOR');
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getColorSensor("' + port + '").getColor().' + getCodeForList(COLORS, color);
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // IR sensor API

    // setChannel(int): void
    Blockly.Blocks['gnikrap_ev3_irsensor_setchannel'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_irsensor_setchannel", EV3_IR_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_set_channel"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "CHANNEL")
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_to_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_setchannel'] = function(block) {
      var channel = block.getFieldValue('CHANNEL');
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getIRSensor("' + port + '").setChannel("' + channel + '");\n';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // getDistance(): int
    Blockly.Blocks['gnikrap_ev3_irsensor_getdistance'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_irsensor_getdistance", EV3_IR_SENSOR_COLOUR, "Number");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.text_distance_to_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_getdistance'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getIRSensor("' + port + '").getDistance()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // getRemoteCommand(): boolean
    var BEACON_BUTTONS = [
        ["TOP_LEFT", "isTopLeftEnabled()"],
        ["TOP_RIGHT", "isTopRightEnabled()"],
        ["BOTTOM_LEFT", "isBottomLeftEnabled()"],
        ["BOTTOM_RIGHT", "isBottomRightEnabled()"],
        ["BEACON", "isBeaconEnabled()"],
        ["NOTHING", "isNothingEnabled()"]];

    Blockly.Blocks['gnikrap_ev3_irsensor_getremotecommand'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_irsensor_getremotecommand", EV3_IR_SENSOR_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                BEACON_BUTTONS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_irsensor_getremotecommand.list_beacon_buttons_enabled_on_sensor"))), "CHECK")
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_getremotecommand'] = function(block) {
      var check = block.getFieldValue('CHECK');
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getIRSensor("' + port + '").getRemoteCommand().' + getCodeForList(BEACON_BUTTONS, check);
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Keyboard API

    // wait(touch): void
    var KEYBOARD_BUTTONS = [
        ["UP", "getUp()"],
        ["DOWN", "getDown()"],
        ["LEFT", "getLeft()"],
        ["RIGHT", "getRight()"],
        ["ENTER", "getEnter()"]
        /*, ["ESCAPE", "getEscape()"] */];
    var KEYBOARD_BUTTONS_ACTIONS = [
        ["PRESSED", "waitForPress()"],
        ["PRESSED_AND_RELEASED", "waitForPressAndRelease()"]];

    Blockly.Blocks['gnikrap_ev3_keyboard_wait'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_keyboard_wait", EV3_KEYBOARD_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                KEYBOARD_BUTTONS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_keyboard_wait.list_keyboard_buttons_wait"))), "BUTTON")
            .appendField(new Blockly.FieldDropdown(
                KEYBOARD_BUTTONS_ACTIONS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_keyboard_wait.list_keyboard_buttons_actions"))), "ACTION");
      }
    };
    Blockly.JavaScript['gnikrap_ev3_keyboard_wait'] = function(block) {
      var button = block.getFieldValue('BUTTON');
      var action = block.getFieldValue('ACTION');

      return 'ev3.getBrick().getKeyboard().' +
          getCodeForList(KEYBOARD_BUTTONS, button) + '.' + getCodeForList(KEYBOARD_BUTTONS_ACTIONS, action) + ';\n';
    };

    // isPressed(touch): boolean
    Blockly.Blocks['gnikrap_ev3_keyboard_ispressed'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_keyboard_ispressed", EV3_KEYBOARD_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                KEYBOARD_BUTTONS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_keyboard_ispressed.list_keyboard_buttons_is_pressed"))), "BUTTON");
      }
    };
    Blockly.JavaScript['gnikrap_ev3_keyboard_ispressed'] = function(block) {
      var button = block.getFieldValue('BUTTON');

      var code = 'ev3.getBrick().getKeyboard().' + getCodeForList(KEYBOARD_BUTTONS, button) + '.isDown()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Motor API

    // setType(port, type): void
    var MOTOR_TYPE = [
        ["LARGE", "getLargeMotor"],
        ["MEDIUM", "getMediumMotor"]];

    Blockly.Blocks['gnikrap_ev3_motor_settype'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_motor_settype", EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                MOTOR_TYPE.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_motor_settype.list_motor_type_connected_on"))), "TYPE")
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: this.getFieldValue('TYPE'), action: 'setMotorType' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_settype'] = function(block) {
      var type = block.getFieldValue('TYPE');
      var port = block.getFieldValue('PORT');

      return '"@setMotorType(' + port + ', ' + getCodeForList(MOTOR_TYPE, type) + ')";\n';
    };

    // move(action, port): void
    var MOTOR_ACTION1 = [
        ["FORWARD", "forward()"],
        ["BACKWARD", "backward()"],
        ["STOP_LOCK", "stop(true)"],
        ["STOP", "stop(false)"]];

    Blockly.Blocks['gnikrap_ev3_motor_move'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_motor_move", EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                MOTOR_ACTION1.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_motor_move.list_motor_actions"))), "ACTION")
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_move'] = function(block) {
      var port = block.getFieldValue('PORT');
      var action = block.getFieldValue('ACTION');

      return 'ev3.getBrick().getLargeMotor("' + port + '").' + getCodeForList(MOTOR_ACTION1, action) + ';\n';
    };

    // isMoving(port): boolean
    Blockly.Blocks['gnikrap_ev3_motor_ismoving'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_motor_ismoving", EV3_MOTOR_COLOUR, "Boolean");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_is_moving"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_ismoving'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").isMoving()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // rotate(port, value, type): void
    var MOTOR_ACTION2 = [["ROTATE"], ["ROTATE_NO_WAIT"]]; // No need javascript code
    var ANGLE_UNIT = [["DEGREE"], ["TURN"]]; // No need javascript code

    Blockly.Blocks['gnikrap_ev3_motor_rotate'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_motor_rotate", EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                MOTOR_ACTION2.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_motor_rotate.list_motor_actions"))), "ACTION")
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_rotate.text_for"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(ANGLE_UNIT.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_motor_rotate.list_angle_unit"))), "ANGLE_UNIT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_rotate'] = function(block) {
      var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC)
                  || 0; // Default value if no args
      var angle_unit = block.getFieldValue('ANGLE_UNIT');
      var action = block.getFieldValue('ACTION');
      var port = block.getFieldValue('PORT');

      return 'ev3.getBrick().getLargeMotor("'+ port + '").rotate(' +
          (angle_unit == "TURN" ? value * 360 : value) +
          ', ' + (action == "ROTATE_NO_WAIT" ? "true" : "false") + ');\n';
    };

    // setSpeed(port, speed): void
    var SPEED_UNIT = [["DEGREE_PER_S"], ["TURN_PER_S"], ["PERCENT"]]; // No need javascript code

    Blockly.Blocks['gnikrap_ev3_motor_setspeed'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_motor_setspeed", EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_setspeed.text_set_speed_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendValueInput("SPEED")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_setspeed.text_to"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(SPEED_UNIT.map(createListForFieldDropdownMapper("blocks.list_speed_unit"))), "SPEED_UNIT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_setspeed'] = function(block) {
      var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC)
                  || 0; // Default value of no args
      var speed_unit = block.getFieldValue('SPEED_UNIT');
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").';
      if(speed_unit == "DEGREE_PER_S") {
        code += 'setSpeed(' + speed + ')';
      } else if(speed_unit == "TURN_PER_S") {
        code += 'setSpeed(' + speed + '*360)';
      } else {
        code += 'setSpeedPercent(' + speed + ')';
      }
      return code + ';\n';
    };

    // getSpeed(port): void
    Blockly.Blocks['gnikrap_ev3_motor_getspeed'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_motor_getspeed", EV3_MOTOR_COLOUR, "Number");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_getspeed.text_speed_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_getspeed.text_in"))
            .appendField(new Blockly.FieldDropdown(SPEED_UNIT.map(createListForFieldDropdownMapper("blocks.list_speed_unit"))), "SPEED_UNIT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_getspeed'] = function(block) {
      var port = block.getFieldValue('PORT');
      var speed_unit = block.getFieldValue('SPEED_UNIT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").';
      if(speed_unit == "DEGREE_PER_S") {
        code += 'getSpeed()';
      } else if(speed_unit == "TURN_PER_S") {
        code += 'getSpeed()/360';
      } else {
        code += 'getSpeedPercent()';
      }      
      return [code, Blockly.JavaScript.ORDER_NONE]; // Can be a mix of function call and divide <=> ORDER_NONE to avoid problem
    };

    //  getTacho(port): int
    Blockly.Blocks['gnikrap_ev3_motor_gettacho'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_motor_gettacho", EV3_MOTOR_COLOUR, "Number");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_gettacho.text_tacho_count_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_gettacho'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").getTachoCount()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // resetTacho(port): void
    Blockly.Blocks['gnikrap_ev3_motor_resettacho'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_motor_resettacho", EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_resettacho.text_reset_tacho_count_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setInputsInline(true);

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_motor_resettacho'] = function(block) {
      var port = block.getFieldValue('PORT');

      return 'ev3.getBrick().getLargeMotor("' + port + '").resetTachoCount();\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // xSensor sensor API

    // Used to initialize XSensor in order to check that xSensor 'value' blocks are inside a xSensor 'work with' block
    function initXSensor(block) {
      block.onchange = function() {
          var parent = block.getParent();
          while(parent) {
            if(parent.type == "gnikrap_ev3_xsensor_workwith") {
              block.setWarningText(null);
              return;
            }
            parent = parent.getParent();
          }
          block.setWarningText(i18n.t("blocks.errors.blockXSensorValue"));
        };
    }

    // This one isn't simple !
    // Get the xSensor, check if it exists, then get the value, and check if the xSensor is running. Finally execute the user code (if running)
    Blockly.Blocks['gnikrap_ev3_xsensor_workwith'] = {
      init: function() {
        initBlockStackable(this, "blocks.gnikrap_ev3_xsensor_workwith", XSENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_with_the_xSensor"))
            .appendField(new Blockly.FieldTextInput("xGyro"), "XSENSOR_NAME")
            .appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_started"));
        this.appendStatementInput("DO")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_do"));
        this.setMutator(new Blockly.Mutator(['gnikrap_ev3_xsensor_workwith_else']));

        this.elseCount_ = 0;
      },

      // Populate the mutator's dialog with this block's components.
      decompose: function(workspace) {
        // Init top level block
        var containerBlock = Blockly.Block.obtain(workspace, 'gnikrap_ev3_xsensor_workwith_workwith');
        containerBlock.initSvg();
        var connection = containerBlock.getInput('STACK').connection;
        // Populate else if needed
        if(this.elseCount_) {
          var elseBlock = Blockly.Block.obtain(workspace, 'gnikrap_ev3_xsensor_workwith_else');
          elseBlock.initSvg();
          connection.connect(elseBlock.previousConnection);
        }
        return containerBlock;
      },

      // Reconfigure this block based on the mutator dialog's components.
      compose: function(containerBlock) {
        // Disconnect the else input blocks and remove the inputs.
        if (this.elseCount_) {
          this.removeInput('ELSE');
        }
        this.elseCount_ = 0;
        // Rebuild the block's optional inputs.
        var clauseBlock = containerBlock.getInputTargetBlock('STACK');
        while (clauseBlock) {
          switch (clauseBlock.type) {
            case 'gnikrap_ev3_xsensor_workwith_else':
              this.elseCount_++;
              var elseInput = this.appendStatementInput('ELSE');
              elseInput.appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_else"));
              // Reconnect any child blocks.
              if (clauseBlock.statementConnection_) {
                elseInput.connection.connect(clauseBlock.statementConnection_);
              }
              break;
            default:
              throw 'Unknown block type.';
          }
          clauseBlock = clauseBlock.nextConnection &&
              clauseBlock.nextConnection.targetBlock();
        }
      },
      
      // Store pointers to any connected child blocks.
      saveConnections: function(containerBlock) {
        var clauseBlock = containerBlock.getInputTargetBlock('STACK');
        while (clauseBlock) {
          switch (clauseBlock.type) {
            case 'gnikrap_ev3_xsensor_workwith_else':
              var inputDo = this.getInput('ELSE');
              clauseBlock.statementConnection_ =
                  inputDo && inputDo.connection.targetConnection;
              break;
            default:
              throw 'Unknown block type.';
          }
          clauseBlock = clauseBlock.nextConnection &&
              clauseBlock.nextConnection.targetBlock();
        }
      },

      // Add additional data while serialized to XML
      mutationToDom: function() {
        if (!this.elseCount_) {
          return null;
        }
        var container = document.createElement('mutation');
        if (this.elseCount_) {
          container.setAttribute('else', 1);
        }
        return container;
      },

      // Get block data while de-serialize from XML
      domToMutation: function(xmlElement) {
        this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 1);
        if (this.elseCount_) {
          this.appendStatementInput('ELSE')
              .appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_else"));
        }
      }
    };

    // Mutator for gnikrap_ev3_xsensor_workwith
    Blockly.Blocks['gnikrap_ev3_xsensor_workwith_workwith'] = {
      init: function() {
        this.setColour(XSENSOR_COLOUR);
        this.appendDummyInput()
            .appendField("if xSensor started"); // TODO i18n
        this.appendStatementInput('STACK');
        this.contextMenu = false;
      }
    };
    // Mutator for gnikrap_ev3_xsensor_workwith
    Blockly.Blocks['gnikrap_ev3_xsensor_workwith_else'] = {
      init: function() {
        this.setColour(XSENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_xsensor_workwith.text_else"));
        this.setPreviousStatement(true);
        this.contextMenu = false;
      }
    };

    Blockly.JavaScript['gnikrap_ev3_xsensor_workwith'] = function(block) {
      var do0 = Blockly.JavaScript.statementToCode(block, 'DO');
      var xsensor_name = block.getFieldValue('XSENSOR_NAME');

      var fDefinition = [
          'function ' + Blockly.JavaScript.FUNCTION_NAME_PLACEHOLDER_ + '() {',
          '  var xSensor = ev3.getXSensor("' + xsensor_name + '");',
          '  var xSensorValue = (xSensor ? xSensor.getValue() : null);',
          '  if(xSensorValue && xSensorValue.isStarted()) {',
          Blockly.JavaScript.prefixLines(do0.replace(new RegExp(self.XSENSOR_MAGIC, "g"), 'xSensorValue'), Blockly.JavaScript.INDENT)];
          
      if (block.elseCount_) {
        fDefinition = fDefinition.concat([
          '  }  else {', 
          Blockly.JavaScript.prefixLines(Blockly.JavaScript.statementToCode(block, 'ELSE'), Blockly.JavaScript.INDENT)]);
      }
      fDefinition = fDefinition.concat(['  }', '}']); // close if or else, and close function

      var fName = Blockly.JavaScript.provideFunction_(
          Blockly.JavaScript.variableDB_.getDistinctName('doXSensorProcessingOn' + xsensor_name), // Use a unique variable name in order to have a different function for each workWith block
          fDefinition);
      return fName + '();\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // xGyro sensor API

    // getValue(axis): float
    var XGYRO_AXIS = [
        ["X", "getX()"],
        ["Y", "getY()"],
        ["Z", "getZ()"]];

    Blockly.Blocks['gnikrap_ev3_xgyro_getvalue'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_xgyro_getvalue", XSENSOR_COLOUR, "Number");
        initXSensor(this);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                XGYRO_AXIS.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_xgyro_getvalue.list_axis_angle"))), "AXIS");
      }
    };
    Blockly.JavaScript['gnikrap_ev3_xgyro_getvalue'] = function(block) {
      var axis = block.getFieldValue('AXIS');

      var code = self.XSENSOR_MAGIC + '.' + getCodeForList(XGYRO_AXIS, axis) + '.getAngle()';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // xGeo sensor API

    // getValue(field): float
    var XGEO_ACTION = [
        ["LATITUDE", "getLatitude()"],
        ["LONGITUDE", "getLongitude()"],
        ["ACCURACY", "getAccuracy()"],
        ["ALTITUDE", "getAltitude()"],
        ["ALTITUDE_ACCURACY", "getAltitudeAccuracy()"],
        ["TIMESTAMP", "getTimestamp()"]];

    Blockly.Blocks['gnikrap_ev3_xgeo_getvalue'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_xgeo_getvalue", XSENSOR_COLOUR, "Number");
        initXSensor(this);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                XGEO_ACTION.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_xgeo_getvalue.list_measure"))), "ACTION");
      }
    };
    Blockly.JavaScript['gnikrap_ev3_xgeo_getvalue'] = function(block) {
      var action = block.getFieldValue('ACTION');

      var code = self.XSENSOR_MAGIC + '.' + getCodeForList(XGEO_ACTION, action);
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // xVideo sensor API

    // containsObject(objectName): boolean
    Blockly.Blocks['gnikrap_ev3_xvideo_containsobject'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_xvideo_containsobject", XSENSOR_COLOUR, "Boolean");
        initXSensor(this);
        this.appendValueInput("OBJECT_NAME")
            .setCheck("String")
            .appendField(i18n.t("blocks.gnikrap_ev3_xvideo_containsobject.text_xVideo_known_the_object"));
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_xvideo_containsobject'] = function(block) {
      var object_name = Blockly.JavaScript.valueToCode(block, 'OBJECT_NAME', Blockly.JavaScript.ORDER_ATOMIC);

      var code = self.XSENSOR_MAGIC + '.containsObject(' + object_name + ')';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    // getValue(objectName, axis): integer
    var XVIDEO_AXIS_FOR_OBJECT = [
        ["X", "getX()"],
        ["Y", "getY()"]];

    Blockly.Blocks['gnikrap_ev3_xvideo_getvalue'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_xvideo_getvalue", XSENSOR_COLOUR, "Number");
        initXSensor(this);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown(
                XVIDEO_AXIS_FOR_OBJECT.map(createListForFieldDropdownMapper("blocks.gnikrap_ev3_xvideo_getvalue.list_axis_for_object"))), "AXIS");
        this.appendValueInput("OBJECT_NAME")
            .setCheck("String");
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_xvideo_getvalue'] = function(block) {
      var object_name = Blockly.JavaScript.valueToCode(block, 'OBJECT_NAME', Blockly.JavaScript.ORDER_ATOMIC);
      var axis = block.getFieldValue('AXIS');

      var code = self.XSENSOR_MAGIC + '.getObject(' + object_name + ').' + getCodeForList(XVIDEO_AXIS_FOR_OBJECT, axis);
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };

    /////////////////////////////////////////////////////////////////////////////
    // xTouch sensor API

    // isTouchPressed(touchName): boolean
    Blockly.Blocks['gnikrap_ev3_xtouch_istouchpressed'] = {
      init: function() {
        initBlockWithOutput(this, "blocks.gnikrap_ev3_xtouch_istouchpressed", XSENSOR_COLOUR, "Boolean");
        initXSensor(this);
        this.appendValueInput("TOUCH_NAME")
            .setCheck("String")
            .appendField(i18n.t("blocks.gnikrap_ev3_xtouch_istouchpressed.text_xTouch_touch"));
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_xtouch_istouchpressed.text_is_pressed"));
        this.setInputsInline(true);
      }
    };
    Blockly.JavaScript['gnikrap_ev3_xtouch_istouchpressed'] = function(block) {
      var touch_name = Blockly.JavaScript.valueToCode(block, 'TOUCH_NAME', Blockly.JavaScript.ORDER_ATOMIC);

      var code = self.XSENSOR_MAGIC + '.containsTouch(' + touch_name + ')';
      return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
    };
  };
}
