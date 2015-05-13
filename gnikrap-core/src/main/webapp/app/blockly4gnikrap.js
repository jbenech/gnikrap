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

// In this file we define all Gnikrap blocks and also toolbar utilities

// Define all the blocks for Blockly
(function() {
  'use strict';

  var EV3_BLOCKS_COLOUR = 0;
  
  /////////////////////////////////////////////////////////////////////////////
  // EV3 object API
  
  // notify(String): void
  Blockly.Blocks['gnikrap_ev3_notify'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ev3_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendValueInput("TEXT")
          .appendField("notify");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };
  Blockly.JavaScript['gnikrap_ev3_notify'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC);
    var code = "ev3.notify(" + value_text + ")";
    return code;
  };
  
  // isOK(): boolean
  Blockly.Blocks['gnikrap_ev3_isok'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ev3_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendDummyInput()
          .appendField("EV3 is ok");
      this.setOutput(true, "Boolean");
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_isok'] = function(block) {
    var code = "ev3.isOk()";
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  // sleep(int): void
  Blockly.Blocks['gnikrap_ev3_sleep'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ev3_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendValueInput("TIME")
          .setCheck("Number")
          .appendField("sleep");
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["millisecond", "MS"], ["second", "S"]]), "TIME_UNIT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_sleep'] = function(block) {
    var value_time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_time_unit = block.getFieldValue('TIME_UNIT');
    // TODO: Assemble JavaScript into code variable.
    var code = "ev3.sleep(" + (dropdown_time_unit == 'S' ? (value_time * 1000) : value_time) + ")";
    return code;
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // LED object API
  Blockly.Blocks['gnikrap_ev3_led'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_led_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendDummyInput()
          .appendField("change the LED status to")
          .appendField(new Blockly.FieldDropdown([["off", "OFF"], 
            ["green", "GREEN"], ["flashing green", "GREEN_1"], ["fast flashing green", "GREEN_2"],
            ["orange", "ORANGE"], ["flashing orange", "ORANGE_1"], ["fast flashing orange", "ORANGE_2"],
            ["red", "RED"], ["flashing red", "RED_1"], ["fast flashing red", "RED_2"]]), "STATUS");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_led'] = function(block) {
    var dropdown_status = block.getFieldValue('STATUS');
    var code = '';
    switch(dropdown_status) {
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
    return 'ev3.getBrick().getLED().' + code;
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // Sound object API

  // setVolume(int): void
  Blockly.Blocks['gnikrap_ev3_sound_setvolume'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_sound_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendValueInput("VOL")
          .setCheck("Number")
          .appendField("set volume to");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_sound_setvolume'] = function(block) {
    var value_vol = Blockly.JavaScript.valueToCode(block, 'VOL', Blockly.JavaScript.ORDER_ATOMIC);
    var code = 'ev3.getBrick().getSound().setVolume(' + value_vol + ')';
    return code;
  };
  
  // beep()
  Blockly.Blocks['gnikrap_ev3_sound_beep'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_sound_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendDummyInput()
          .appendField("beep");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_sound_beep'] = function(block) {
    var code = 'ev3.getBrick().getSound().beep()';
    return code;
  };  
  
  // playNote(string, int): void
  Blockly.Blocks['gnikrap_ev3_sound_playnote'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_sound_object');
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendValueInput("NOTE")
          .setCheck("String")
          .appendField("play note");
      this.appendValueInput("DURATION")
          .setCheck("Number")
          .appendField("for");
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["millisecond", "MS"], ["second", "S"]]), "TIME_UNIT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_sound_playnote'] = function(block) {
    var value_note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC);
    var value_duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_time_unit = block.getFieldValue('TIME_UNIT');
    var code = 'ev3.getBrick().getSound().playNote("' + value_note + '", ' +
        (dropdown_time_unit == 'S' ? (value_duration * 1000) : value_duration) + ')';
    return code;
  };  

  /////////////////////////////////////////////////////////////////////////////
  // Touch sensor API
  
  Blockly.Blocks['gnikrap_ev3_touchsensor_pushed'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_touch_sensor_object');
      this.appendDummyInput()
          .appendField("is sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT")
          .appendField("pushed ?");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_touchsensor_pushed'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var code = 'ev3.getBrick().getTouchSensor("' + dropdown_port + '").isPushed()';
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  

  /////////////////////////////////////////////////////////////////////////////
  // Color sensor API
  
  // getReflectedLight(): float
  Blockly.Blocks['gnikrap_ev3_colorsensor_reflected'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_color_sensor_object');
      this.appendDummyInput()
          .appendField("reflected light of sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_colorsensor_reflected'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var code = 'ev3.getBrick().getColorSensor("' + dropdown_port + '").getReflectedLight()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  

  // getAmbientLight(): float
  Blockly.Blocks['gnikrap_ev3_colorsensor_ambient'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_color_sensor_object');
      this.appendDummyInput()
          .appendField("ambient light of sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_colorsensor_ambient'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var code = 'ev3.getBrick().getColorSensor("' + dropdown_port + '").getAmbientLight()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  
  
  // getColor(): String
  Blockly.Blocks['gnikrap_ev3_colorsensor_getcolor'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_color_sensor_object');
      this.appendDummyInput()
          .appendField("color of sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_colorsensor_getcolor'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var code = 'ev3.getBrick().getColorSensor("' + dropdown_port + '").getColor().getColorAsText()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  

  // isColor(color): boolean
  Blockly.Blocks['gnikrap_ev3_colorsensor_iscolor'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_color_sensor_object');
      this.appendDummyInput()
          .appendField("is")
          .appendField(new Blockly.FieldDropdown([["black", "BLACK"], ["blue", "BLUE"], ["yellow", "YELLOW"], ["red", "RED"], ["white", "WHITE"], ["brown", "BROWN"], ["no color", "NONE"]]), "COLOR")
          .appendField("detected by sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setTooltip('');
    }
  };
  
  Blockly.JavaScript['gnikrap_ev3_colorsensor_iscolor'] = function(block) {
    var dropdown_color = block.getFieldValue('COLOR');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = '';
    switch(dropdown_status) {
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
    code = 'ev3.getBrick().getColorSensor("' + dropdown_port + '").getColor().' + code;
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  /////////////////////////////////////////////////////////////////////////////
  // IR sensor API
  
  // setChannel(int): void
  Blockly.Blocks['gnikrap_ev3_irsensor_setchannel'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ir_infra_red_sensor_object');
      this.appendDummyInput()
          .appendField("set channel ")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "CHANNEL")
          .appendField("to IR sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_irsensor_setchannel'] = function(block) {
    var dropdown_channel = block.getFieldValue('CHANNEL');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getIRSensor("' + dropdown_port + '").setChannel("' + dropdown_channel + '")';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };
  
  // getDistance(): int
  Blockly.Blocks['gnikrap_ev3_irsensor_getdistance'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ir_infra_red_sensor_object');
      this.appendDummyInput()
          .appendField("distance to IR sensor")
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip('');
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_irsensor_getdistance'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var code = 'ev3.getBrick().getIRSensor("' + dropdown_port + '").getDistance()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  
  
  // getRemoteCommand(): boolean
  Blockly.Blocks['gnikrap_ev3_irsensor_getremotecommand'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ir_infra_red_sensor_object');
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["is top left enabled", "TOP_LEFT"], ["is top right enabled", "TOP_RIGHT"], ["is bottom left enabled", "BOTTOM_LEFT"], ["is bottom right enabled", "BOTTOM_RIGHT"], ["is beacon enabled", "BEACON"]]), "CHECK")
          .appendField("on IR sensor")
          .appendField(new Blockly.FieldDropdown([["option", "OPTIONNAME"], ["option", "OPTIONNAME"], ["option", "OPTIONNAME"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setTooltip('');
    }
  };
  
  Blockly.JavaScript['gnikrap_ev3_irsensor_getremotecommand'] = function(block) {
    var dropdown_check = block.getFieldValue('CHECK');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = '';
    switch(dropdown_check) {
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
      default:
        code = 'isBeaconEnabled()';
        break;
    }
    code = 'ev3.getBrick().getIRSensor("' + dropdown_port + '").getRemoteCommand().' + code;
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  
  
})();

// Define utils function for blockly
var BlocklyUtils = (function() {

  // Expected block: {type: xxx, xmlContent: xxx }
  var blockToXML = function(block) {
    return '<block type="' + block.type + '">' + 
        (block.xmlContent ? block.xmlContent : '') + 
        '</block>';
  };
  
  var generateBlocklyCategories = function() {
    var xml = [ ];
    // Logic
    xml.push('<category id="catLogic" name="Logic">');
    xml.push([
          {type: "controls_if"},
          {type: "controls_if",
            xmlContent: '<mutation else="1"></mutation>' },
          {type: "logic_compare"},
          {type: "logic_operation"},
          {type: "logic_negate"}, 
          {type: "logic_boolean"}
        ].map(blockToXML).join(''));
    // Other existing blocks: logic_null, logic_ternary
    xml.push('</category>');
    
    // Loop
    xml.push('<category id="catLoops"  name="Loops">');
    xml.push([
          {type: "controls_repeat_ext", 
            xmlContent: '<value name="TIMES"><block type="math_number"><field name="NUM">10</field></block></value>'},
          {type: "controls_whileUntil"},
          {type: "controls_whileUntil",
            xmlContent: '<value name="BOOL"><block type="gnikrap_ev3_isok"></block></value>'},
          {type: "controls_forEach"}
        ].map(blockToXML).join(''));
    // Other existing blocks: controls_for, controls_flow_statements
    xml.push('</category>');

    // Math
    xml.push('<category id="catMath" name="Math">');
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
        ].map(blockToXML).join(''));        
    // Other existing blocks: math_trig, math_constant, math_change, math_random_float
    xml.push('</category>');

    // Text
    xml.push('<category id="catText" name="Text">');
    xml.push([
          {type: "text"}, 
          {type: "text_join"},
          {type: "text_length"}, 
          {type: "text_isEmpty"},
          {type: "text_charAt",
            xmlContent: '<value name="VALUE"><block type="variables_get"><field name="VAR" class="textVar">text</field></block></value>' + 
              '<value name="AT"><block type="math_number"><field name="NUM">0</field></block></value>'}
        ].map(blockToXML).join(''));
    // other existing blocks: text_append, text_indexOf, text_getSubstring, text_changeCase, text_trim, text_print, text_prompt_ext
    xml.push('</category>');
    
    // Lists
    xml.push('<category id="catLists" name="Lists">');
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
        ].map(blockToXML).join(''));
    // other existing blocks: lists_repeat, list-split
    xml.push('</category>');
    
    return xml.join('');
  };
  
  var generateGnikrapCategories = function() {
    var xml = [];

    xml.push('<category name="EV3 blocks">');
    xml.push([
          //{type: "gnikrap_motor"},
          {type: "gnikrap_ev3_notify"},
          {type: "gnikrap_ev3_isok"},
          {type: "controls_whileUntil",
            xmlContent: '<value name="BOOL"><block type="gnikrap_ev3_isok"></block></value>'},
          {type: "gnikrap_ev3_sleep",
            xmlContent: '<value name="TIME"><block type="math_number"><field name="NUM">100</field></block></value>' },
          {type: "gnikrap_ev3_led"},
          {type: "gnikrap_ev3_sound_setvolume",
            xmlContent: '<value name="VOL"><block type="math_number"><field name="NUM">70</field></block></value>' },
          {type: "gnikrap_ev3_sound_beep" },
          {type: "gnikrap_ev3_sound_playnote",
            xmlContent: '<value name="NOTE"><block type="text"><field name="TEXT">Do</field></block></value>' +
                        '<value name="DURATION"><block type="math_number"><field name="NUM">100</field></block></value>'}
        ].map(blockToXML).join(''));

    xml.push('</category>');

    xml.push('<category name="Sensors blocks">');
    xml.push([
          //{type: "gnikrap_motor"},
          {type: "gnikrap_ev3_touchsensor_pushed"},
          {type: "gnikrap_ev3_colorsensor_reflected"},
          {type: "gnikrap_ev3_colorsensor_ambient"},
          {type: "gnikrap_ev3_colorsensor_getcolor"},
          {type: "gnikrap_ev3_colorsensor_iscolor"},
          {type: "gnikrap_ev3_irsensor_setchannel"},
          {type: "gnikrap_ev3_irsensor_getdistance"},
          {type: "gnikrap_ev3_irsensor_getremotecommand"}
        ].map(blockToXML).join(''));

    xml.push('</category>');
    
    return xml.join('');
  };
    
  var generateToolbox = function() {
    // Very simple XML => Generate with string concatenation
    var xml = [ '<xml>' ];

    xml.push(generateBlocklyCategories());

    xml.push('<sep></sep>');
    xml.push(generateGnikrapCategories());
    
    // Magic categories
    xml.push('<sep></sep>');
    xml.push('<category name="Variables" custom="VARIABLE"></category>');
    xml.push('<category name="Functions" custom="PROCEDURE"></category>');

    xml.push('</xml>');
    
    return xml.join('');
  };

  return {
    generateToolbox: generateToolbox
  };
})();
