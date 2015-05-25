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
//    A first phase driven by blockly will generate a Javascript that is not
//    runnable on the EV3 but not optimized and true for the motor type to use.
//    A second phase will post-process this code (mainly with regexp) in order
//    to have an optimized Javascript.
//
//    This choice has been made because:
//     - It is difficult to find the 'good' way to do it (no documentation on this topic).
//     - Why trying to do it, we end up by using methods/fields beginning or ending with  '_'.
//       The documentation state that these methods should be considered as private/unstable, so it's
//       not a viable option.
//     - The only clean way to achieve it seems to (re-)write all the code generation for a whole new
//       language eg. 'GnikrapJS' => This is too much work for the expected benefit.
//     - PostProcessing is the simplest and straightforward way to implement it.
//
//  * User program verification/validation is done in real time at the workspace level - complexity 0(n).
//     - Warning are displayed on the blocks to help the users
//       Note: Don't perform the checks at the block level as it lead to a complexity 0(n2) as described in the
//             block factory sample.
//    Verification are also done in the Javascript code post-processing phase.
//     - Some case will emit warning, some other will block the script to be sent to the EV3 brick


// Define utils function for blockly
function GnikrapBlocks() {
  'use strict';

  var self = this;
  (function() { // Init
     // Make blockly more flashy
    Blockly.HSV_SATURATION = 0.70;
    Blockly.HSV_VALUE = 0.65;

    self.XSENSOR_MAGIC = '@XSensorValue@';
/*
    // Define some variable name that will be internally used (and should not be used by the user)
    // Note: Another option should be to use Blockly.JavaScript.variableDB_.getDistinctName() in buildJavascriptCode()
    var variableName = ['ev3Keyboard', 'ev3LED', 'ev3Sound']; // Objects without port
    ['ev3TouchSensor', 'ev3ColorSensor', 'ev3IRSensor'].forEach(function(sensor) {
      ['1', '2', '3', '4'].forEach(function(port) {
          variableName.push(sensor + '_' + port);
      });
    });
    ['A', 'B', 'C', 'D'].forEach(function(port) {
      variableName.push('ev3Motor_' + port);
    });
    Blockly.JavaScript.addReservedWords(variableName.join(','));
*/

    self.workspace = undefined; // Useless, already to undefined here :-)
  })();

  // Return the name of the Blockly translation file according to the given language
  self.__getBlocklyTranslationJs = function(language) {
    return "lib/blockly-20150510/msg/js/<LANGUAGE>.js".replace("<LANGUAGE>", language);
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

  // Check the blocks each time somthing change in the Blockly worspace
  self.__checkBlocks = function() {
    //console.log("__checkBlocks " + Date.now());
    var ev3Ports = {}; // key: port, value: { type1: [listOfBlocks], type2: [listOfBlocks] }
    var motorType = {}; // key: port, value: motorType
    var motorBlocks = {}; // key: port, value: [listOfMotorsBlock]

    self.__getWorkspace().getAllBlocks().forEach(function(block) {
        if(block.getEV3PortData && !block.disabled && !block.getInheritedDisabled()) {
          var data = block.getEV3PortData();

          if(data.action == "useMotor") {
            if(!motorBlocks[data.port]) {
              motorBlocks[data.port] = [];
            }
            motorBlocks[data.port].push(block);
          } else {
            // For all blocks (that are not motors)
            if(!ev3Ports[data.port]) {
              ev3Ports[data.port] = {};
            }
            var temp = ev3Ports[data.port];
            if(!temp[data.type]) {
              temp[data.type] = [];
            }
            temp[data.type].push(block);

            if(data.action == "setMotorType") {
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
      self.workspace = Blockly.inject(domElement, { toolbox: self.__generateXmlToolboxTree() });
      self.workspace.addChangeListener(self.__checkBlocks); // Used to set the nodes to warning if needed
    };

    $.getScript(jsFilename).done(initWorkspace)
      .fail(function(jqxhr, settings, exception) {
        console.log("Fail to load javascript file: '" + jsFilename + "' with error: " + exception);
        initWorkspace();
      });
  };

  // Update the language used by Blockly to the given language
  self.updateLanguage = function(language) {
    // Translation of Gnikrap block will be automatic (next call to i18n will do the job)
    // Translation of Blockly blocks need to load the appropriate JS file
    // The toolbox have to be closed. It will be automatically translated at the next use
    // The blocks already created have to be recreated in order to be translated

    // Load again the blockly language JS (Don't understand if Blockly JSON files can be used instead ?)
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

  // Clear the current script
  self.clear = function() {
    self.__getWorkspace().clear();
  };

  // Return an object containing the code generated and the list of error/warning if any
  self.buildJavascriptCode = function() {
    // var GENERATED_VAR_MAGIC = '\uA7FC_'; // Reversed P - See http://www.fileformat.info/info/unicode/char/a7fc/index.htm
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
        return ''; // Discard the motor type definition line
      });

    // Build the list of devices connected to the EV3 ports
    var ev3Ports = {}; // Key: port, value: variable declaration
    [ [/ev3\.getBrick\(\).getTouchSensor\("([1-4])"\)/g, 'ev3TouchSensor'],
      [/ev3\.getBrick\(\).getColorSensor\("([1-4])"\)/g, 'ev3ColorSensor'],
      [/ev3\.getBrick\(\).getIRSensor\("([1-4])"\)/g, 'ev3IRSensor'],
      [/ev3\.getBrick\(\)\.getLargeMotor\("([A-D])"\)/g, 'ev3Motor']
    ].forEach(function(value) {
        code = code.replace(value[0], function(match, p1) {
            // Check if the port is not already used by another device and register it if new
            var varName = value[1] + "_" + p1;
            var varDeclaration = "var " + varName + " = ";
            var isMotor = p1.match(/[A-D]/);
            if(isMotor) {
              if(!motorTypes[p1]) {
                motorTypes[p1] = 'getLargeMotor'; // Default to large motor
                result.warnings.push(i18n.t("blocks.errors.compileMotorTypeNotDefineFor", { port: p1}));
              }
              varDeclaration = varDeclaration + match.replace('getLargeMotor', motorTypes[p1]) + ";\n";
            } else {
              varDeclaration = varDeclaration + match + ";\n";
            }
            if(ev3Ports[p1]) {
              if(ev3Ports[p1] != varDeclaration) {
                result.errors.push(i18n.t("blocks.errors.compilePortUsedForSeveralSensor", { port: p1}));
                return match;
              }
            } else {
              ev3Ports[p1] = varDeclaration;
            }
            return varName;
          });
      });

    // Add in the code the associated variables
    for(var p in ev3Ports) {
      code = ev3Ports[p] + code;
    }

    // Other simple replace (for better Javascript execution performances)
    [ [/ev3.getBrick\(\).getKeyboard\(\)/g, 'ev3Keyboard', 'ev3.getBrick().getKeyboard()'],
      [/ev3.getBrick\(\).getLED\(\)/g, 'ev3LED', 'ev3.getBrick().getLED()'],
      [/ev3.getBrick\(\).getSound\(\)/g, 'ev3Sound', 'ev3.getBrick().getSound()']
    ].forEach(function(value) {
        var varName = value[1];
        var newCode = code.replace(value[0], varName);
        if(newCode.length != code.length) {
          code = 'var ' + varName + ' = ' + value[2] + ';\n' + newCode;
        }
      });

    // Check for xSensor
    if(code.indexOf(self.XSENSOR_MAGIC)) {
      result.errors.push("WTF: XSENSOR NOT USED CORRECTLY !");
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
          //{type: "gnikrap_motor"},
          {type: "gnikrap_ev3_isok"},
          {type: "controls_whileUntil",
            xmlContent: '<value name="BOOL"><block type="gnikrap_ev3_isok"></block></value>'},
          {type: "gnikrap_ev3_notify"},
          {type: "gnikrap_ev3_sleep",
            xmlContent: '<value name="TIME"><block type="math_number"><field name="NUM">100</field></block></value>' },
          {type: "gnikrap_ev3_stop"},
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

    //xml.push('<category name="' + i18n.t("blocks.categories.sensors") + '">');
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
      /*
      xml.push('<category name="' + i18n.t("blocks.categories.keyboard") + '">');
      xml.push([
          ].map(self.__blockToXML).join(''));
      xml.push('</category>');
      */
    //xml.push('</category>');

    xml.push('<category name="' + i18n.t("blocks.categories.motors") + '">');
    xml.push([
          {type: "gnikrap_ev3_motor_settype"},
          {type: "gnikrap_ev3_motor_move"},
          {type: "gnikrap_ev3_motor_rotate",
            xmlContent: '<value name="VALUE"><block type="math_number"><field name="NUM">90</field></block></value>' },
          {type: "gnikrap_ev3_motor_setspeed",
            xmlContent: '<value name="SPEED"><block type="math_number"><field name="NUM">90</field></block></value>'},
          {type: "gnikrap_ev3_motor_getspeed"},
          {type: "gnikrap_ev3_motor_ismoving"},
          {type: "gnikrap_ev3_motor_gettacho"},
          {type: "gnikrap_ev3_motor_resettacho"}
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
            xmlContent: '<value name="OBJECT_NAME"><block type="text"><field name="TEXT">abc</field></block></value>' }
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

    xml.push(self.__generateBlocklyCategories());
    xml.push('<sep></sep>');
    xml.push(self.__generateGnikrapCategories());
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
    var EV3_BRICK_COLOUR = 225;
    var EV3_MOTOR_COLOUR = 275;

    /////////////////////////////////////////////////////////////////////////////
    // EV3 object API

    // notify(String): void
    Blockly.Blocks['gnikrap_ev3_notify'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_notify.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendValueInput("TEXT")
            .appendField(i18n.t("blocks.gnikrap_ev3_notify.text_notify"));
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_notify.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_notify'] = function(block) {
      var text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC);

      return 'ev3.notify(' + text + ');\n';
    };

    // isOK(): boolean
    Blockly.Blocks['gnikrap_ev3_isok'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_isok.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_isok.text_ev3_is_ok"));
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_isok.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_isok'] = function(block) {
      var code = 'ev3.isOk()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // stop(): boolean
    Blockly.Blocks['gnikrap_ev3_stop'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_stop.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_stop.text_stop_script"));
        this.setPreviousStatement(true);
        //this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_stop.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_stop'] = function(block) {
      return 'ev3.exit()';
    };

    // sleep(int): void
    Blockly.Blocks['gnikrap_ev3_sleep'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sleep.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendValueInput("TIME")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sleep.text_sleep"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_time_unit.MS"), "MS"],
              [i18n.t("blocks.list_time_unit.S"), "S"]]), "TIME_UNIT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_sleep.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sleep'] = function(block) {
      var time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC);
      var time_unit = block.getFieldValue('TIME_UNIT');

      return 'ev3.sleep(' + (time_unit == 'S' ? (time * 1000) : time) + ');\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // LED object API
    Blockly.Blocks['gnikrap_ev3_led'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_led.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_led.text_change_LED_status"))
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_led_status.OFF"), "OFF"],
              [i18n.t("blocks.list_led_status.GREEN"), "GREEN"],
              [i18n.t("blocks.list_led_status.GREEN_1"), "GREEN_1"],
              [i18n.t("blocks.list_led_status.GREEN_2"), "GREEN_2"],
              [i18n.t("blocks.list_led_status.ORANGE"), "ORANGE"],
              [i18n.t("blocks.list_led_status.ORANGE_1"), "ORANGE_1"],
              [i18n.t("blocks.list_led_status.ORANGE_2"), "ORANGE_2"],
              [i18n.t("blocks.list_led_status.RED"), "RED"],
              [i18n.t("blocks.list_led_status.RED_1"), "RED_1"],
              [i18n.t("blocks.list_led_status.RED_2"), "RED_2"]]), "STATUS");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_led.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_led'] = function(block) {
      var status = block.getFieldValue('STATUS');

      var code = '';
      switch(status) {
        case "GREEN":
          code = 'lightGreen()';
          break;
        case "GREEN_1":
          code = 'lightGreen().blink()';
          break;
        case "GREEN_2":
          code = 'lightGreen().blink().blink()';
          break;
        case "ORANGE":
          code = 'lightOrange()';
          break;
        case "ORANGE_1":
          code = 'lightOrange().blink()';
          break;
        case "ORANGE_2":
          code = 'lightOrange().blink().blink()';
          break;
        case "RED":
          code = 'lightRed()';
          break;
        case "RED_1":
          code = 'lightRed().blink()';
          break;
        case "RED_2":
          code = 'lightRed().blink().blink()';
          break;
        default:
          code = 'off()';
      }
      return 'ev3.getBrick().getLED().' + code + ';\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // Sound object API

    // setVolume(int): void
    Blockly.Blocks['gnikrap_ev3_sound_setvolume'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_setvolume.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendValueInput("VOL")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_setvolume.text_set_volume"));
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_sound_setvolume.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_setvolume'] = function(block) {
      var vol = Blockly.JavaScript.valueToCode(block, 'VOL', Blockly.JavaScript.ORDER_ATOMIC);

      return 'ev3.getBrick().getSound().setVolume(' + vol + ');\n';
    };

    // beep()
    Blockly.Blocks['gnikrap_ev3_sound_beep'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_beep.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_beep.text_beep"));
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_sound_beep.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_beep'] = function(block) {
      return 'ev3.getBrick().getSound().beep();\n';
    };

    // playNote(string, int): void
    Blockly.Blocks['gnikrap_ev3_sound_playnote'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_playnote.helpUrl"));
        this.setColour(EV3_BRICK_COLOUR);
        this.appendValueInput("NOTE")
            .setCheck("String")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_playnote.text_play_note"));
        this.appendValueInput("DURATION")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_sound_playnote.text_for"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_time_unit.MS"), "MS"],
              [i18n.t("blocks.list_time_unit.S"), "S"]]), "TIME_UNIT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_sound_playnote.tooltip"));
      }
    };
    Blockly.JavaScript['gnikrap_ev3_sound_playnote'] = function(block) {
      var note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC);
      var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC);
      var time_unit = block.getFieldValue('TIME_UNIT');

      // " " are included in the string value
      return 'ev3.getBrick().getSound().playNote(' + note + ', ' +
          (time_unit == 'S' ? (duration * 1000) : duration) + ');\n';
    };

    /////////////////////////////////////////////////////////////////////////////
    // Touch sensor API

    Blockly.Blocks['gnikrap_ev3_touchsensor_pushed'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.helpUrl"));
        this.setColour(EV3_TOUCH_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT")
            .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_is_pushed"));
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'TouchSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_touchsensor_pushed'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getTouchSensor("' + port + '").isPushed()';
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Color sensor API

    // getReflectedLight(): float
    Blockly.Blocks['gnikrap_ev3_colorsensor_reflected'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.helpUrl"));
        this.setColour(EV3_COLOR_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.text_reflected_light") )
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_colorsensor_reflected'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getColorSensor("' + port + '").getReflectedLight()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // getAmbientLight(): float
    Blockly.Blocks['gnikrap_ev3_colorsensor_ambient'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.helpUrl"));
        this.setColour(EV3_COLOR_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.text_ambiant_light"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_colorsensor_ambient'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getColorSensor("' + port + '").getAmbientLight()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // getColor(): String
    Blockly.Blocks['gnikrap_ev3_colorsensor_getcolor'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.helpUrl"));
        this.setColour(EV3_COLOR_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.text_color"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "String");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_colorsensor_getcolor'] = function(block) {
      var port = block.getFieldValue('PORT');
      var code = 'ev3.getBrick().getColorSensor("' + port + '").getColor().getColorAsText()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // isColor(color): boolean
    Blockly.Blocks['gnikrap_ev3_colorsensor_iscolor'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_iscolor.helpUrl"));
        this.setColour(EV3_COLOR_SENSOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_colors.BLACK"), "BLACK"],
              [i18n.t("blocks.list_colors.BLUE"), "BLUE"],
              [i18n.t("blocks.list_colors.YELLOW"), "YELLOW"],
              [i18n.t("blocks.list_colors.RED"), "RED"],
              [i18n.t("blocks.list_colors.WHITE"), "WHITE"],
              [i18n.t("blocks.list_colors.BROWN"), "BROWN"],
              [i18n.t("blocks.list_colors.NONE"), "NONE"]]), "COLOR")
            .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_iscolor.text_is_detected"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_iscolor.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'ColorSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_colorsensor_iscolor'] = function(block) {
      var color = block.getFieldValue('COLOR');
      var port = block.getFieldValue('PORT');

      var code = '';
      switch(color) {
        case "BLACK":
          code = 'isBlack()';
          break;
        case "BLUE":
          code = 'isBlue()';
          break;
        case "YELLOW":
          code = 'isYellow()';
          break;
        case "RED":
          code = 'isRed()';
          break;
        case "WHITE":
          code = 'isWhite()';
          break;
        case "BROWN":
          code = 'isBrown()';
          break;
        default:
          code = 'isNoColor()';
      }
      code = 'ev3.getBrick().getColorSensor("' + port + '").getColor().' + code;
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    /////////////////////////////////////////////////////////////////////////////
    // IR sensor API

    // setChannel(int): void
    Blockly.Blocks['gnikrap_ev3_irsensor_setchannel'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.helpUrl"));
        this.setColour(EV3_IR_SENSOR_COLOUR );
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_set_channel"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "CHANNEL")
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_to_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_setchannel'] = function(block) {
      var channel = block.getFieldValue('CHANNEL');
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getIRSensor("' + port + '").setChannel("' + channel + '");\n';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // getDistance(): int
    Blockly.Blocks['gnikrap_ev3_irsensor_getdistance'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.helpUrl"));
        this.setColour(EV3_IR_SENSOR_COLOUR );
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.text_distance_to_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_getdistance'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getIRSensor("' + port + '").getDistance()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // getRemoteCommand(): boolean
    Blockly.Blocks['gnikrap_ev3_irsensor_getremotecommand'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_getremotecommand.helpUrl"));
        this.setColour(EV3_IR_SENSOR_COLOUR );
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_beacon_buttons_enabled.TOP_LEFT"), "TOP_LEFT"],
              [i18n.t("blocks.list_beacon_buttons_enabled.TOP_RIGHT"), "TOP_RIGHT"],
              [i18n.t("blocks.list_beacon_buttons_enabled.BOTTOM_LEFT"), "BOTTOM_LEFT"],
              [i18n.t("blocks.list_beacon_buttons_enabled.BOTTOM_RIGHT"), "BOTTOM_RIGHT"],
              [i18n.t("blocks.list_beacon_buttons_enabled.BEACON"), "BEACON"],
              [i18n.t("blocks.list_beacon_buttons_enabled.NOTHING"), "NOTHING"]]), "CHECK")
            .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_getremotecommand.text_on_sensor"))
            .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_irsensor_getremotecommand.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: 'IRSensor', action: 'useSensor' };
        };
      }
    };
    Blockly.JavaScript['gnikrap_ev3_irsensor_getremotecommand'] = function(block) {
      var check = block.getFieldValue('CHECK');
      var port = block.getFieldValue('PORT');

      var code = '';
      switch(check) {
        case "TOP_LEFT":
          code = 'isTopLeftEnabled()';
          break;
        case "TOP_RIGHT":
          code = 'isTopRightEnabled()';
          break;
        case "BOTTOM_LEFT":
          code = 'isBottomLeftEnabled()';
          break;
        case "BOTTOM_RIGHT":
          code = 'isBottomRightEnabled()';
          break;
        case "BEACON":
          code = 'isBeaconEnabled()';
          break;
        default:
          code = 'isNothingEnabled()';
      }
      code = 'ev3.getBrick().getIRSensor("' + port + '").getRemoteCommand().' + code;
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Keyboard API

    // wait(touch): void
    Blockly.Blocks['gnikrap_ev3_keyboard_wait'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_keyboard_wait.helpUrl"));
        this.setColour(EV3_KEYBOARD_COLOUR );
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_keyboard_buttons_wait.UP"), "UP"],
              [i18n.t("blocks.list_keyboard_buttons_wait.DOWN"), "DOWN"],
              [i18n.t("blocks.list_keyboard_buttons_wait.LEFT"), "LEFT"],
              [i18n.t("blocks.list_keyboard_buttons_wait.RIGHT"), "RIGHT"],
              [i18n.t("blocks.list_keyboard_buttons_wait.ENTER"), "ENTER"]
              /*, [i18n.t("blocks.list_keyboard_buttons.ESCAPE"), "ESCAPE"] */]), "BUTTON")
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_keyboard_buttons_actions.PRESSED"), "PRESSED"],
              [i18n.t("blocks.list_keyboard_buttons_actions.PRESSED_AND_RELEASED"), "PRESSED_AND_RELEASED"]]), "ACTION");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_keyboard_wait.tooltip"));
      }
    };

    Blockly.JavaScript['gnikrap_ev3_keyboard_wait'] = function(block) {
      var button = block.getFieldValue('BUTTON');
      var action = block.getFieldValue('ACTION');

      var code = '';
      switch(button) {
        case "UP":
          code = 'getUp()';
          break;
        case "DOWN":
          code = 'getDown()';
          break;
        case "LEFT":
          code = 'getLeft()';
          break;
        case "RIGHT":
          code = 'getRight()';
          break;
        case "ESCAPE":
          code = 'getEscape()';
          break;
        default:
          code = 'getEnter()';
      }
      code = code + '.';
      switch(action) {
        case "PRESSED":
          code = 'waitForPress()';
          break;
        default:
          code = 'waitForPressAndRelease()';
      }

      return 'ev3.getBrick().getKeyboard().' + code + ';\n';
    };

    // isPressed(touch): boolean
    Blockly.Blocks['gnikrap_ev3_keyboard_ispressed'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_keyboard_ispressed.helpUrl"));
        this.setColour(EV3_KEYBOARD_COLOUR );
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_keyboard_buttons_is_pressed.UP"), "UP"],
              [i18n.t("blocks.list_keyboard_buttons_is_pressed.DOWN"), "DOWN"],
              [i18n.t("blocks.list_keyboard_buttons_is_pressed.LEFT"), "LEFT"],
              [i18n.t("blocks.list_keyboard_buttons_is_pressed.RIGHT"), "RIGHT"],
              [i18n.t("blocks.list_keyboard_buttons_is_pressed.ENTER"), "ENTER"]
              /*, [i18n.t("blocks.list_keyboard_buttons_is_pressed.ESCAPE"), "ESCAPE"] */]), "BUTTON");
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_keyboard_ispressed.tooltip"));
      }
    };

    Blockly.JavaScript['gnikrap_ev3_keyboard_ispressed'] = function(block) {
      var button = block.getFieldValue('BUTTON');

      var code = '';
      switch(button) {
        case "UP":
          code = 'getUp()';
          break;
        case "DOWN":
          code = 'getDown()';
          break;
        case "LEFT":
          code = 'getLeft()';
          break;
        case "RIGHT":
          code = 'getRight()';
          break;
        case "ESCAPE":
          code = 'getEscape()';
          break;
        default:
          code = 'getEnter()';
      }
      code = 'ev3.getBrick().getKeyboard().' + code + '.isDown()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    /////////////////////////////////////////////////////////////////////////////
    // Motor API

    // setType(port, type): void
    Blockly.Blocks['gnikrap_ev3_motor_settype'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_settype.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_motor_type.LARGE"), "LARGE"],
              [i18n.t("blocks.list_motor_type.MEDIUM"), "MEDIUM"]]), "TYPE")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_settype.text_is_connected_on"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_settype.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: this.getFieldValue('TYPE'), action: 'setMotorType' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_settype'] = function(block) {
      var type = block.getFieldValue('TYPE');
      var port = block.getFieldValue('PORT');

      var code = '';
      switch(type) {
        case "MEDIUM":
          code = 'getMediumMotor';
          break;
        default:
          code = 'getLargeMotor';
      }
      return '"@setMotorType(' + port + ', ' + code + ')";\n';
    };

    // move(action, port): void
    Blockly.Blocks['gnikrap_ev3_motor_move'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_move.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_motor_actions1.FORWARD"), "FORWARD"],
              [i18n.t("blocks.list_motor_actions1.BACKWARD"), "BACKWARD"],
              [i18n.t("blocks.list_motor_actions1.STOP_LOCK"), "STOP_LOCK"],
              [i18n.t("blocks.list_motor_actions1.STOP"), "STOP"]]), "ACTION")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_move.text_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_move.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_move'] = function(block) {
      var port = block.getFieldValue('PORT');
      var action = block.getFieldValue('ACTION');

      var code = '';
      switch(action) {
        case "FORWARD":
          code = 'forward()';
          break;
        case "BACKWARD":
          code = 'backward()';
          break;
        case "STOP_LOCK":
          code = 'stop(true)';
          break;
        default:
          code = 'stop(false)';
      }
      return 'ev3.getBrick().getLargeMotor("' + port + '").' + code + ';\n';
    };

    // isMoving(port): boolean
    Blockly.Blocks['gnikrap_ev3_motor_ismoving'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_ismoving.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_is_moving"));
        this.setOutput(true, "Boolean");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_ismoving.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_ismoving'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").isMoving()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // rotate(port, value, type): void
    Blockly.Blocks['gnikrap_ev3_motor_rotate'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_rotate.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_motor_actions2.ROTATE"), "ROTATE"],
              [i18n.t("blocks.list_motor_actions2.ROTATE_NO_WAIT"), "ROTATE_NO_WAIT"]]), "ACTION")
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendValueInput("VALUE")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_rotate.text_for"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_angle_unit.DEGREE"), "DEGREE"],
              [i18n.t("blocks.list_angle_unit.TURN"), "TURN"]]), "ANGLE_UNIT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_rotate.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_rotate'] = function(block) {
      var value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
      var angle_unit = block.getFieldValue('ANGLE_UNIT');
      var action = block.getFieldValue('ACTION');
      var port = block.getFieldValue('PORT');

      return 'ev3.getBrick().getLargeMotor("'+ port + '").rotate(' +
          (angle_unit == "TURN" ? value * 360 : value) +
          ', ' + (action == "ROTATE_NO_WAIT" ? "true" : "false") + ');\n';
    };

    // setSpeed(port, speed): void
    Blockly.Blocks['gnikrap_ev3_motor_setspeed'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_setspeed.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_setspeed.text_set_speed_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendValueInput("SPEED")
            .setCheck("Number")
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_setspeed.text_to"));
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_speed_unit.DEGREE_PER_S"), "DEGREE_PER_S"],
              [i18n.t("blocks.list_speed_unit.PERCENT"), "PERCENT"]]), "SPEED_UNIT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_setspeed.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_setspeed'] = function(block) {
      var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC);
      var speed_unit = block.getFieldValue('SPEED_UNIT');
      var port = block.getFieldValue('PORT');

      return 'ev3.getBrick().getLargeMotor("' + port + '").' +
          (speed_unit == "PERCENT" ? 'setSpeedPercent' : 'setSpeed' ) + '(' + speed + ');\n';
    };

    // getSpeed(port): void
    Blockly.Blocks['gnikrap_ev3_motor_getspeed'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_getspeed.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_getspeed.text_speed_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_getspeed.text_in"))
            .appendField(new Blockly.FieldDropdown([
              [i18n.t("blocks.list_speed_unit.DEGREE_PER_S"), "DEGREE_PER_S"],
              [i18n.t("blocks.list_speed_unit.PERCENT"), "PERCENT"]]), "SPEED_UNIT");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_getspeed.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_getspeed'] = function(block) {
      var port = block.getFieldValue('PORT');
      var speed_unit = block.getFieldValue('SPEED_UNIT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").' +
          (speed_unit == "PERCENT" ? 'getSpeedPercent' : 'getSpeed' ) + '()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    //  getTacho(port): int
    Blockly.Blocks['gnikrap_ev3_motor_gettacho'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_gettacho.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_gettacho.text_tacho_count_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_gettacho.tooltip"));

        this.getEV3PortData = function() {
          return { port: this.getFieldValue('PORT'), type: undefined, action: 'useMotor' };
        };
      }
    };

    Blockly.JavaScript['gnikrap_ev3_motor_gettacho'] = function(block) {
      var port = block.getFieldValue('PORT');

      var code = 'ev3.getBrick().getLargeMotor("' + port + '").getTachoCount()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    // resetTacho(port): void
    Blockly.Blocks['gnikrap_ev3_motor_resettacho'] = {
      init: function() {
        this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_resettacho.helpUrl"));
        this.setColour(EV3_MOTOR_COLOUR);
        this.appendDummyInput()
            .appendField(i18n.t("blocks.gnikrap_ev3_motor_resettacho.text_reset_tacho_count_of_motor"))
            .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_resettacho.tooltip"));

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

    Blockly.Blocks['gnikrap_ev3_xsensor_workwith'] = {
      init: function() {
        this.setHelpUrl('http://www.example.com/');
        this.appendDummyInput()
            .appendField("with the xSensor")
            .appendField(new Blockly.FieldTextInput("xGyro"), "XSENSOR_NAME")
            .appendField("started");
        this.appendStatementInput("DO")
            .setAlign(Blockly.ALIGN_RIGHT)
            .appendField("do");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('');
      }
    };

    Blockly.JavaScript['gnikrap_ev3_xsensor_workwith'] = function(block) {
      var do0 = Blockly.JavaScript.statementToCode(block, 'DO');
      var xsensor_name = block.getFieldValue('XSENSOR_NAME');
      var functionVar = Blockly.JavaScript.variableDB_.getDistinctName(xsensor_name + '_value', Blockly.Variables.NAME_TYPE)

      var code = '(function(' + functionVar + ') {\n' +
        '  if(' + functionVar + ' && ' + functionVar + '.isStarted()) {\n' +
        do0.replace(new RegExp(self.XSENSOR_MAGIC, "g"), functionVar) +
        '  }\n' +
      '})(ev3.getXSensor("' + xsensor_name + '"));';
      console.log("code: " + code); // TODO remove
      return code;
    };

    /////////////////////////////////////////////////////////////////////////////
    // xGyro sensor API
    
    Blockly.Blocks['gnikrap_ev3_xgyro_getvalue'] = {
      init: function() {
        this.setHelpUrl('http://www.example.com/');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              ["xGyro x axis angle", "X"], 
              ["xGyro y axis angle", "Y"], 
              ["xGyro z axis angle", "Z"]]), "AXIS");
        this.setOutput(true, "Number");
        this.setTooltip('');
      }
    };

    Blockly.JavaScript['gnikrap_ev3_xgyro_getvalue'] = function(block) {
      var axis = block.getFieldValue('AXIS');
      
      var code = '';
      switch(axis) {
        case 'X':
          code = 'getX()';
          break;
        case 'Y':
          code = 'getY()';
          break;
        default:
          code = 'getZ()';
      }
      code = self.XSENSOR_MAGIC + '.' + code + '.getAngle()';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };

    /////////////////////////////////////////////////////////////////////////////
    // xGeo sensor API

    Blockly.Blocks['gnikrap_ev3_xgeo_getvalue'] = {
      init: function() {
        this.setHelpUrl('http://www.example.com/');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              ["xGeo latitude", "LATITUDE"], 
              ["xGeo longitude", "LONGITUDE"], 
              ["xGeo accuracy", "ACCURACY"], 
              ["xGeo altitude", "ALTITUDE"], 
              ["xGeo altitude accuracy", "ALTITUDE_ACCURACY"], 
              ["xGeo timestamp", "TIMESTAMP"]]), "ACTION");
        this.setOutput(true, "Number");
        this.setTooltip('');
      }
    };

    Blockly.JavaScript['gnikrap_ev3_xgeo_getvalue'] = function(block) {
      var action = block.getFieldValue('ACTION');

      var code = '';
      switch(action) {
        case 'LATITUDE':
          code = 'getLatitude()';
          break;
        case 'LONGITUDE':
          code = 'getLongitude()';
          break;
        case 'ACCURACY':
          code = 'getAccuracy()';
          break;
        case 'ALTITUDE':
          code = 'getAltitude()';
          break;
        case 'ALTITUDE_ACCURACY':
          code = 'getAltitudeAccuracy()';
          break;
        default:
          code = 'getTimestamp()';
      }
      code = self.XSENSOR_MAGIC + '.' + code;
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    
    /////////////////////////////////////////////////////////////////////////////
    // xVideo sensor API

    Blockly.Blocks['gnikrap_ev3_xvideo_containsobject'] = {
      init: function() {
        this.setHelpUrl('http://www.example.com/');
        this.appendValueInput("OBJECT_NAME")
            .setCheck("String")
            .appendField("xVideo knows the object");
        this.setInputsInline(true);
        this.setOutput(true, "Boolean");
        this.setTooltip('');
      }
    };

    Blockly.JavaScript['gnikrap_ev3_xvideo_containsobject'] = function(block) {
      var object_name = Blockly.JavaScript.valueToCode(block, 'OBJECT_NAME', Blockly.JavaScript.ORDER_ATOMIC);
      
      var code = self.XSENSOR_MAGIC + '.containsObject(' + object_name + ')';
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };
    
    Blockly.Blocks['gnikrap_ev3_xvideo_getvalue'] = {
      init: function() {
        this.setHelpUrl('http://www.example.com/');
        this.appendDummyInput()
            .appendField(new Blockly.FieldDropdown([
              ["xVideo x value for object", "X"], 
              ["xVideo y value for object", "Y"]]), "AXIS");
        this.appendValueInput("OBJECT_NAME")
            .setCheck("String");
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setTooltip('');
      }
    };    
    
    Blockly.JavaScript['gnikrap_ev3_xvideo_getvalue'] = function(block) {
      var object_name = Blockly.JavaScript.valueToCode(block, 'OBJECT_NAME', Blockly.JavaScript.ORDER_ATOMIC);
      var axis = block.getFieldValue('AXIS');
      
      var code = '';
      switch(axis) {
        case 'X':
          code = 'getX()';
          break;
        default:
          code = 'getY()';
      }
      code = self.XSENSOR_MAGIC + '.getObject(' + object_name + ').' + code;
      // TODO: Change ORDER_NONE to the correct strength.
      return [code, Blockly.JavaScript.ORDER_NONE];
    };    
  };
}
