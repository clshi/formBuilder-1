'use strict';

if(typeof(window.neon) === 'undefined') {
	window.neon = new Object();
}

window.neon.Builder = (function($) {
  var utils = fbUtils;

  var Builder = function(options, element) {
    var defaults = {
      controlPosition: 'left',
      controlOrder: [],
      dataType: 'xml',
      // Array of fields to disable
      disableFields: [],
      editOnAdd: false,
      // Uneditable fields or other content you would like to appear before and after regular fields:
      append: false,
      prepend: false,
      // Not use
      defaultFields: [],
      // Not use
      inputSets: [],
      fieldRemoveWarn: false,
      roles: {
        1: 'Administrator'
      },
      messages: {
        addOption: 'Add Option +',
        allFieldsRemoved: 'All fields were removed.',
        allowSelect: 'Allow Select',
        allowMultipleFiles: 'Allow users to upload multiple files',
        autocomplete: 'Autocomplete',
        button: 'Button',
        cannotBeEmpty: 'This field cannot be empty',
        checkboxGroup: 'Checkbox Group',
        checkbox: 'Checkbox',
        checkboxes: 'Checkboxes',
        className: 'Class',
        clearAllMessage: 'Are you sure you want to clear all fields?',
        clearAll: 'Clear',
        close: 'Close',
        content: 'Content',
        copy: 'Copy To Clipboard',
        copyButton: '&#43;',
        copyButtonTooltip: 'Copy',
        dateField: 'Date Field',
        description: 'Help Text',
        descriptionField: 'Description',
        devMode: 'Developer Mode',
        editNames: 'Edit Names',
        editorTitle: 'Form Elements',
        editXML: 'Edit XML',
        enableOther: 'Enable &quot;Other&quot;',
        enableOtherMsg: 'Let users to enter an unlisted option',
        fieldDeleteWarning: false,
        fieldVars: 'Field Variables',
        fieldNonEditable: 'This field cannot be edited.',
        fieldRemoveWarning: 'Are you sure you want to remove this field?',
        fileUpload: 'File Upload',
        formUpdated: 'Form Updated',
        getStarted: 'Drag a field from the right to this area',
        header: 'Header',
        hide: 'Edit',
        hidden: 'Hidden Input',
        label: 'Label',
        labelEmpty: 'Field Label cannot be empty',
        limitRole: 'Limit access to one or more of the following roles:',
        mandatory: 'Mandatory',
        maxlength: 'Max Length',
        minOptionMessage: 'This field requires a minimum of 2 options',
        multipleFiles: 'Multiple Files',
        name: 'Name',
        no: 'No',
        number: 'Number',
        off: 'Off',
        on: 'On',
        option: 'Option',
        optional: 'optional',
        optionLabelPlaceholder: 'Label',
        optionValuePlaceholder: 'Value',
        optionEmpty: 'Option value required',
        other: 'Other',
        paragraph: 'Paragraph',
        placeholder: 'Placeholder',
        placeholders: {
          value: 'Value',
          label: 'Label',
          text: '',
          textarea: '',
          email: 'Enter you email',
          placeholder: '',
          className: 'space separated classes',
          password: 'Enter your password'
        },
        preview: 'Preview',
        radioGroup: 'Radio Group',
        radio: 'Radio',
        removeMessage: 'Remove Element',
        removeOption: 'Remove Option',
        remove: '&#215;',
        required: 'Required',
        richText: 'Rich Text Editor',
        roles: 'Access',
        save: 'Save',
        selectOptions: 'Options',
        select: 'Select',
        selectColor: 'Select Color',
        selectionsMessage: 'Allow Multiple Selections',
        size: 'Size',
        sizes: {
          xs: 'Extra Small',
          sm: 'Small',
          m: 'Default',
          lg: 'Large'
        },
        style: 'Style',
        styles: {
          btn: {
            'default': 'Default',
            danger: 'Danger',
            info: 'Info',
            primary: 'Primary',
            success: 'Success',
            warning: 'Warning'
          }
        },
        subtype: 'Type',
        text: 'Text Field',
        textArea: 'Text Area',
        toggle: 'Toggle',
        warning: 'Warning!',
        value: 'Value',
        viewJSON: '{  }',
        viewXML: '&lt;/&gt;',
        yes: 'Yes'
      },
      notify: {
        error: function(message) {
          return console.error(message);
        },
        success: function(message) {
          return console.log(message);
        },
        warning: function(message) {
          return console.warn(message);
        }
      },
      sortableControls: false,
      stickyControls: false,
      // no use
      showActionButtons: true,
      typeUserAttrs: {},
      typeUserEvents: {},
      prefix: 'neon-form-builder-'
    };

    defaults.messages.subtypes = (() => {
      const subtypeDefault = (subtype) => {
        return {
          label: subtype,
          value: subtype
        };
      };

      return {
          text: ['text', 'password', 'email', 'color', 'tel'].map(subtypeDefault),
          header: ['h1', 'h2', 'h3'].map(subtypeDefault),
          button: ['button', 'submit', 'reset'].map(subtypeDefault),
          paragraph: ['p','address','blockquote','canvas','output'].map(subtypeDefault)
        };
    })();

    this.opts = Object.assign({}, defaults, options);
    if (options.messages) {
      this.opts.messages = Object.assign({}, defaults.messages, options.messages);
    }

    this.element = element;
    this._helpers = formBuilderHelpersFn(this.opts, this);
    this.layout = this._helpers.editorLayout(this.opts.controlPosition);
  };

  Builder.prototype.init = function() {
    this.frmbID = this.genFrmbID();
    this.opts.formID = this.frmbID;
  };

  Builder.prototype.genFrmbID = function() {
    var type = this.opts.type;
    return 'frmb-' + type + '-' + $('ul[id^=frmb-' + type + ']-').length++;
  };

  Builder.prototype.createControlBoxDom = function(frmbFields) {
    var frmbID = this.frmbID;
    var boxID = frmbID + '-control-box';
    // Create draggable fields for formBuilder
    var cbUl = utils.markup('ul', null, {id: boxID, className: 'frmb-control'});

    var $cbUL = $(cbUl);

    // Loop through
    utils.forEach(frmbFields, (i) => {
      let $field = $('<li/>', {
        'class': 'icon-' + frmbFields[i].attrs.className,
        'type': frmbFields[i].attrs.type,
        'name': frmbFields[i].attrs.className,
        'label': frmbFields[i].label
      });

      $field.data('newFieldData', frmbFields[i]);
      $field.data('attrs', frmbFields[i].attrs);

      let typeLabel = utils.markup('span', frmbFields[i].label);
      $field.html(typeLabel).appendTo($cbUL);
    });

    return $cbUL;
  };

  Builder.prototype.buildControlBox = function() {
    var opts = this.opts;
    var frmbFields = this._helpers.orderFields(opts.frmbFields);
    if (opts.disableFields) {
      // remove disabledFields
      frmbFields = frmbFields.filter(function(field) {
        return !utils.inArray(field.attrs.type, opts.disableFields);
      });
    }

    var $cbUL = this.createControlBoxDom(frmbFields);
    this.$cbUL = $cbUL;

    if (opts.sortableControls) {
      $cbUL.addClass('sort-enabled');
    }

  };

  Builder.prototype.createFieldBoxDom = function() {
    var frmbID = this.frmbID;
    var $sortableFields = $('<ul/>').attr('id', frmbID).addClass('frmb');
    
    return $sortableFields;
  };

  Builder.prototype.buildFieldBox = function() {
    var $sortableFields = this.createFieldBoxDom();
    this.$sortableFields = $sortableFields;
    this.lastID = this.frmbID + '-fld-1';
  };

  Builder.prototype.bindControlBoxEvents = function() {
    var self = this;
    var _helpers = this._helpers;
    var $sortableFields = this.$sortableFields;
    var $cbUL = this.$cbUL;
    var opts = this.opts;
    // ControlBox with different fields
    $cbUL.sortable({
      helper: 'clone',
      opacity: 0.9,
      connectWith: $sortableFields,
      cancel: '.fb-separator',
      cursor: 'move',
      scroll: false,
      placeholder: 'ui-state-highlight',
      start: _helpers.startMoving,
      stop: _helpers.stopMoving,
      revert: 150,
      beforeStop: _helpers.beforeStop,
      distance: 3,
      update: function(event, ui) {
        if (_helpers.doCancel) {
          return false;
        }
        if (ui.item.parent()[0] === $sortableFields[0]) {
          self.processControl(ui.item);
          _helpers.doCancel = true;
        } else {
          _helpers.setFieldOrder($cbUL);
          _helpers.doCancel = !opts.sortableControls;
        }
      }
    });

    $('li', $cbUL).click(function() {
      _helpers.stopIndex = undefined;
      self.processControl($(this));
      _helpers.save();
    });
  };

  Builder.prototype.bindFieldBoxEvents = function() {
    var $sortableFields = this.$sortableFields;
    var _helpers = this._helpers;
    $sortableFields.sortable({
      cursor: 'move',
      opacity: 0.9,
      revert: 150,
      beforeStop: _helpers.beforeStop,
      start: _helpers.startMoving,
      stop: _helpers.stopMoving,
      cancel: 'input, select, .disabled, .form-group, .btn',
      placeholder: 'frmb-placeholder'
    });

    var saveAndUpdate = _helpers.debounce(function(evt) {
      if (evt) {
        if (evt.type === 'keyup' && this.name === 'className') {
          return false;
        }
      }

      let $field = $(this).parents('.form-field:eq(0)');
      _helpers.updatePreview($field);
      _helpers.save();
    });

    // Save field on change
    $sortableFields.on('change blur keyup', '.form-elements input, .form-elements select, .form-elements textarea', saveAndUpdate);
  };

  Builder.prototype.processControl = function(control) {
    this.prepFieldVars(control, true);
  };

  Builder.prototype.prepFieldVars = function($field, isNew = false) {

  };

  Builder.prototype.render = function() {
    var frmbID = this.frmbID;
    var _helpers = this._helpers;
    var $formWrap = $('<div/>', {
      id: frmbID + '-form-wrap',
      'class': 'form-wrap form-builder' + _helpers.mobileClass()
    });

    var $stageWrap = $('<div/>', {
      id: frmbID + '-stage-wrap',
      'class': 'stage-wrap ' + this.layout.stage
    });

    var cbWrap = $('<div/>', {
      id: frmbID + '-cb-wrap',
      'class': 'cb-wrap ' + this.layout.controls
    }).append(this.$cbUL[0]);

    $stageWrap.append(this.$sortableFields, cbWrap);
    $stageWrap.before($formWrap);
    $formWrap.append($stageWrap, cbWrap);
    $(this.element).append($formWrap);

    this.$stageWrap = $stageWrap;
  };

  Builder.prototype.create = function() {
    this.init();
    this.buildControlBox();
    this.buildFieldBox();
    this.render();
    this.bindControlBoxEvents();
    this.bindFieldBoxEvents();
  };

  // Add append and prepend options if necessary
  Builder.prototype.nonEditableFields = function() {
    var opts = this.opts;
    var $sortableFields = this.$sortableFields;

    let cancelArray = [];

    if (opts.prepend && !$('.disabled.prepend', $sortableFields).length) {
      let prependedField = utils.markup('li', opts.prepend, {className: 'disabled prepend'});
      cancelArray.push(true);
      $sortableFields.prepend(prependedField);
    }

    if (opts.append && !$('.disabled.append', $sortableFields).length) {
      let appendedField = utils.markup('li', opts.append, {className: 'disabled append'});
      cancelArray.push(true);
      $sortableFields.append(appendedField);
    }

    if (cancelArray.some(elem => elem === true)) {
      this.$stageWrap.removeClass('empty');
    }
  };
 
  return Builder;

})(jQuery);