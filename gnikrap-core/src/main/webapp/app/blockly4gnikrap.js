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

  /////////////////////////////////////////////////////////////////////////////
  // EV3 object API
  Blockly.Blocks['gnikrap_ev3_notify'] = {
    init: function() {
      this.setHelpUrl('http://jbenech.github.io/gnikrap/gnikrap-doc/index.html#_the_ev3_object');
      this.appendValueInput("TEXT")
          .appendField("Notify");
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
  
  Blockly.Blocks['gnikrap_ev3_isok'] = {
    init: function() {
      this.setHelpUrl('http://www.example.com/');
      this.setColour(210);
      this.appendDummyInput()
          .appendField("Is EV3 ok ?");
      this.setOutput(true, "Boolean");
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_isok'] = function(block) {
    var code = "ev3.isOk()";
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.JavaScript.ORDER_NONE];
  };

  // https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#x9ghpv
  Blockly.Blocks['gnikrap_ev3_sleep'] = {
    init: function() {
      this.setHelpUrl('http://www.example.com/');
      this.appendValueInput("TIME")
          .setCheck("Number")
          .appendField("Sleep");
      this.appendDummyInput()
          .appendField(new Blockly.FieldDropdown([["millisecond", "MS"], ["second", "S"]]), "UNIT");
      this.setInputsInline(true);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip('');
    }
  };

  Blockly.JavaScript['gnikrap_ev3_sleep'] = function(block) {
    var value_time = Blockly.JavaScript.valueToCode(block, 'TIME', Blockly.JavaScript.ORDER_ATOMIC);
    var dropdown_unit = block.getFieldValue('UNIT');
    // TODO: Assemble JavaScript into code variable.
    var code = "ev3.sleep(" + (dropdown_unit == 'S' ? (value_time * 1000) : value_time) + ")";
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
  
  var blockTypeToXML = function(blockType) {
    return '<block type="' + blockType + '"></block>';
  };
    
  var generateToolbox = function() {
    // Very simple XML => Generate with string concatenation
    var xml = [ '<xml>' ];

    // Logic
    xml.push('<category id="catLogic" name="Logic">');
    xml.push(["controls_if", "logic_compare", "logic_operation", "logic_negate", "logic_boolean"].map(blockTypeToXML).join(''));
    // Other existing blocks: logic_null, logic_ternary
    xml.push('</category>');
    
    // Loop
    xml.push('<category id="catLoops"  name="Loops">');
    xml.push([
        {type: "controls_repeat_ext", 
          xmlContent: '<value name="TIMES"><block type="math_number"><field name="NUM">10</field></block></value>'},
        {type: "controls_whileUntil"},
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
    
    /*      
      <category id="catLists" name="Lists2">
        <block type="lists_create_empty"></block>
        <block type="lists_create_with"></block>
        <block type="lists_repeat">
          <value name="NUM">
            <block type="math_number">
              <field name="NUM">5</field>
            </block>
          </value>
        </block>
        <block type="lists_length"></block>
        <block type="lists_isEmpty"></block>
        <block type="lists_indexOf">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR" class="listVar">...</field>
            </block>
          </value>
        </block>
        <block type="lists_getIndex">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR" class="listVar">...</field>
            </block>
          </value>
        </block>
        <block type="lists_setIndex">
          <value name="LIST">
            <block type="variables_get">
              <field name="VAR" class="listVar">...</field>
            </block>
          </value>
        </block>
        <block type="lists_getSublist">
          <value name="LIST">
            <block type="variables_get">
              <field name="VAR" class="listVar">...</field>
            </block>
          </value>
        </block>
        <block type="lists_split">
          <value name="DELIM">
            <block type="text">
              <field name="TEXT">,</field>
            </block>
          </value>
        </block>
      </category>
      
      <!-- Sample with sub-categories -->
      <category name="Custom">
        <block type="start"></block>
        <category name="Move">
          <block type="text"></block>
          <block type="text"></block>
        </category>
        <category name="Turn">
          <block type="math_number"></block>
          <block type="math_number"></block>
        </category>
      </category>
      
      <!-- Custom blocks -->
      <category name="Blocks">
        <block type="gnikrap_motor"></block>
        <block type="gnikrap_ev3_notify"></block>
        <block type="gnikrap_ev3_sleep">
          <value name="TIME">
            <block type="math_number">
              <field name="NUM">100</field>
            </block>
          </value>
        </block>
        <block type="math_number">
          <field name="NUM">42</field>
        </block>
        <block type="controls_for">
          <value name="FROM">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
          <value name="TO">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
          <value name="BY">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
        </block>
      </category>
*/

    // Magic categories
    xml.push('<sep></sep>');
    xml.push('<category name="Variables" custom="VARIABLE"></category>');
    xml.push('<category name="Functions" custom="PROCEDURE"></category>');

    xml.push('</xml>');
    
    console.log('toolbox: ' + xml.join(''));
    return xml.join('');
  };

  return {
    generateToolbox: generateToolbox
  };
})();
