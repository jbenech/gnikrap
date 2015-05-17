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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_notify.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendValueInput("TEXT")
          .appendField(i18n.t("blocks.gnikrap_ev3_notify.text_notify"));
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_notify.tooltip"));
    }
  };
  Blockly.JavaScript['gnikrap_ev3_notify'] = function(block) {
    var value_text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC);
    var code = "ev3.notify(" + value_text + ");";
    return code;
  };
  
  // isOK(): boolean
  Blockly.Blocks['gnikrap_ev3_isok'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_isok.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_isok.text_ev3_is_ok"));
      this.setOutput(true, "Boolean");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_isok.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sleep.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
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
    var value_time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_time_unit = block.getFieldValue('TIME_UNIT');
    // TODO: Assemble JavaScript into code variable.
    var code = "ev3.sleep(" + (dropdown_time_unit == 'S' ? (value_time * 1000) : value_time) + ");";
    return code;
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // LED object API
  Blockly.Blocks['gnikrap_ev3_led'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_led.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
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
    return 'ev3.getBrick().getLED().' + code + ';';
  };
  
  /////////////////////////////////////////////////////////////////////////////
  // Sound object API

  // setVolume(int): void
  Blockly.Blocks['gnikrap_ev3_sound_setvolume'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_setvolume.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
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
    var value_vol = Blockly.JavaScript.valueToCode(block, 'VOL', Blockly.JavaScript.ORDER_ATOMIC);
    var code = 'ev3.getBrick().getSound().setVolume(' + value_vol + ');';
    return code;
  };
  
  // beep()
  Blockly.Blocks['gnikrap_ev3_sound_beep'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_beep.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_sound_beep.text_beep"));
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_sound_beep.tooltip"));
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_sound_beep'] = function(block) {
    var code = 'ev3.getBrick().getSound().beep();';
    return code;
  };  
  
  // playNote(string, int): void
  Blockly.Blocks['gnikrap_ev3_sound_playnote'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_sound_playnote.helpUrl"));
      this.setColour(EV3_BLOCKS_COLOUR);
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
    var value_note = Blockly.JavaScript.valueToCode(block, 'NOTE', Blockly.JavaScript.ORDER_ATOMIC);
    var value_duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_time_unit = block.getFieldValue('TIME_UNIT');
    var code = 'ev3.getBrick().getSound().playNote("' + value_note + '", ' +
        (dropdown_time_unit == 'S' ? (value_duration * 1000) : value_duration) + ');';
    return code;
  };  

  /////////////////////////////////////////////////////////////////////////////
  // Touch sensor API
  
  Blockly.Blocks['gnikrap_ev3_touchsensor_pushed'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_sensor"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT")
          .appendField(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.text_is_pushed"));
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_touchsensor_pushed.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.text_reflected_light") )
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_reflected.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.text_ambiant_light"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_ambient.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.text_color"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "String");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_colorsensor_getcolor.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_colorsensor_iscolor.helpUrl"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_set_channel"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "CHANNEL")
          .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.text_to_sensor"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_irsensor_setchannel.tooltip"));
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_irsensor_setchannel'] = function(block) {
    var dropdown_channel = block.getFieldValue('CHANNEL');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getIRSensor("' + dropdown_port + '").setChannel("' + dropdown_channel + '");';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };
  
  // getDistance(): int
  Blockly.Blocks['gnikrap_ev3_irsensor_getdistance'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.text_distance_to_sensor"))
          .appendField(new Blockly.FieldDropdown([["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_irsensor_getdistance.tooltip"));
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
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_irsensor_getremotecommand.helpUrl"));
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
      case "BEACON":
        code = 'isBeaconEnabled()';
        break;
      default:
        code = 'isNothingEnabled()';
    }
    code = 'ev3.getBrick().getIRSensor("' + dropdown_port + '").getRemoteCommand().' + code;
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  

  /////////////////////////////////////////////////////////////////////////////
  // Keyboard API

  // wait(touch): void
  Blockly.Blocks['gnikrap_ev3_keyboard_wait'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_keyboard_wait.helpUrl"));
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
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_keyboard_wait'] = function(block) {
    var dropdown_button = block.getFieldValue('BUTTON');
    var dropdown_action = block.getFieldValue('ACTION');
    // TODO: Assemble JavaScript into code variable.
    var code = '';
    switch(dropdown_button) {
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
    switch(dropdown_action) {
      case "PRESSED":
        code = 'waitForPress()';
        break;
      default:
        code = 'waitForPressAndRelease()';
    }
        
    code = 'ev3.getKeyboard().' + code + ';';
    return code;
  };

  // isPressed(touch): boolean
  Blockly.Blocks['gnikrap_ev3_keyboard_ispressed'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_keyboard_ispressed.helpUrl"));
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
    var dropdown_button = block.getFieldValue('BUTTON');
    // TODO: Assemble JavaScript into code variable.
    var code = '';
    switch(dropdown_button) {
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
    code = 'ev3.getKeyboard().' + code + '.isDown()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  
  
  /////////////////////////////////////////////////////////////////////////////
  // Motor API
  
  // setType(port, type): void
  Blockly.Blocks['gnikrap_ev3_motor_settype'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_settype.helpUrl"));
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([
            [i18n.t("blocks.list_motor_type.LARGE"), "LARGE"], 
            [i18n.t("blocks.list_motor_type.MEDIUM"), "MEDIUM"]]), "TYPE")
          .appendField(i18n.t("blocks.gnikrap_ev3_motor_settype.text_is_connected_on"))
          .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_settype.tooltip"));
    }
  };

  Blockly.JavaScript['gnikrap_ev3_motor_settype'] = function(block) {
    var dropdown_type = block.getFieldValue('TYPE');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    //var code = '...';
    
    //Blockly.JavaScript.definitions_
    
    return null;
  };  
  
  // move(action, port): void
  Blockly.Blocks['gnikrap_ev3_motor_move'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_move.helpUrl"));
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
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_motor_move'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var dropdown_action = block.getFieldValue('ACTION');
    var code = '';
    switch(dropdown_action) {
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
    code = 'ev3.getBrick().getLargeMotor("' + dorpdown_port + '").' + code + ';';
    return code;
  };  
  
  // isMoving(port): boolean
  Blockly.Blocks['gnikrap_ev3_motor_ismoving'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_ismoving.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_motor"))
          .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT")
          .appendField(i18n.t("blocks.gnikrap_ev3_motor_ismoving.text_is_moving"));
      this.setOutput(true, "Boolean");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_ismoving.tooltip"));
    }
  };

  Blockly.JavaScript['gnikrap_ev3_motor_ismoving'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("' + dropdown_port + '").isMoving()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };
  
  // rotate(port, value, type): void
  Blockly.Blocks['gnikrap_ev3_motor_rotate'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_rotate.helpUrl"));
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
    }
  };

  Blockly.JavaScript['gnikrap_ev3_motor_rotate'] = function(block) {
    var value_value = Blockly.JavaScript.valueToCode(block, 'VALUE', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_angle_unit = block.getFieldValue('ANGLE_UNIT');
    var dropdown_action = block.getFieldValue('ACTION');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("'+ dropdown_port + '").rotate(' + 
        (dropdown_angle_unit == "TURN" ? value_value * 360 : value_value) + 
        ', ' + (dropdown_action == "ROTATE_NO_WAIT" ? "true" : "false") + ');';
    return code;
  };  
  
  // setSpeed(port, speed): void
  Blockly.Blocks['gnikrap_ev3_motor_setspeed'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_setspeed.helpUrl"));
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
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_motor_setspeed'] = function(block) {
    var value_speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_speed_unit = block.getFieldValue('SPEED_UNIT');
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("' + dropdown_port + '").' + 
        (dropdown_speed_unit == "PERCENT" ? 'setSpeedPercent' : 'setSpeed' ) + '(' + value_speed + ');';
    return code;
  };  
  
  // getSpeed(port): void
  Blockly.Blocks['gnikrap_ev3_motor_getspeed'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_getspeed.helpUrl"));
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
    }
  };

  Blockly.JavaScript['gnikrap_ev3_motor_getspeed'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    var dropdown_speed_unit = block.getFieldValue('SPEED_UNIT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("' + dropdown_port + '").' + 
        (dropdown_speed_unit == "PERCENT" ? 'getSpeedPercent' : 'getSpeed' ) + '()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  

  //  getTacho(port): int
  Blockly.Blocks['gnikrap_ev3_motor_gettacho'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_gettacho.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_motor_gettacho.text_tacho_count_of_motor"))
          .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_gettacho.tooltip"));
    }
  };  
  
  Blockly.JavaScript['gnikrap_ev3_motor_gettacho'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("' + dropdown_port + '").getTachoCount()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };  
  
  // resetTacho(port): void
  Blockly.Blocks['gnikrap_ev3_motor_resettacho'] = {
    init: function() {
      this.setHelpUrl(i18n.t("blocks.gnikrap_ev3_motor_resettacho.helpUrl"));
      this.appendDummyInput()
          .appendField(i18n.t("blocks.gnikrap_ev3_motor_resettacho.text_reset_tacho_count_of_motor"))
          .appendField(new Blockly.FieldDropdown([["A", "A"], ["B", "B"], ["C", "C"], ["D", "D"]]), "PORT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip(i18n.t("blocks.gnikrap_ev3_motor_resettacho.tooltip"));
    }
  };

  Blockly.JavaScript['gnikrap_ev3_motor_resettacho'] = function(block) {
    var dropdown_port = block.getFieldValue('PORT');
    // TODO: Assemble JavaScript into code variable.
    var code = 'ev3.getBrick().getLargeMotor("' + dropdown_port + '").resetTachoCount();';
    return code;
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
                        '<value name="DURATION"><block type="math_number"><field name="NUM">100</field></block></value>' }
        ].map(blockToXML).join(''));
    xml.push('</category>');

    xml.push('<category name="Sensors blocks">');
    xml.push([
          {type: "gnikrap_ev3_touchsensor_pushed"},
          {type: "gnikrap_ev3_colorsensor_reflected"},
          {type: "gnikrap_ev3_colorsensor_ambient"},
          {type: "gnikrap_ev3_colorsensor_getcolor"},
          {type: "gnikrap_ev3_colorsensor_iscolor"},
          {type: "gnikrap_ev3_irsensor_setchannel"},
          {type: "gnikrap_ev3_irsensor_getdistance"},
          {type: "gnikrap_ev3_irsensor_getremotecommand"},
          {type: "gnikrap_ev3_keyboard_wait"},
          {type: "gnikrap_ev3_keyboard_ispressed"}
        ].map(blockToXML).join(''));
    xml.push('</category>');

    xml.push('<category name="xSensors blocks">');
    xml.push([
        ].map(blockToXML).join(''));
    xml.push('</category>');
    
    xml.push('<category name="Motors blocks">');
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
        ].map(blockToXML).join(''));
    xml.push('</category>');
    
    return xml.join('');
  };
  
  var generateMagicCategories = function() {
    var xml = [];
    xml.push('<category name="Variables" custom="VARIABLE"></category>');
    xml.push('<category name="Functions" custom="PROCEDURE"></category>');
    return xml.join('');
  }
    
  var generateToolbox = function() {
    // Very simple XML => Generate with string concatenation
    var xml = [ '<xml>' ];
    
    xml.push(generateBlocklyCategories());
    xml.push('<sep></sep>');
    xml.push(generateGnikrapCategories());
    xml.push('<sep></sep>');
    xml.push(generateMagicCategories());

    xml.push('</xml>');
    return xml.join('');
  };

  return {
    generateToolbox: generateToolbox
  };
})();
