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
      defaultFields: [],
      fieldRemoveWarn: false,
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
        checked: 'Checked',
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
        hidden: 'Hidden',
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
      showActionButtons: true,
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

  Builder.prototype.buildControlBox = function() {
    var opts = this.opts;

    var frmbFields = this._helpers.orderFieldsByName(opts.frmbFields);
    if (opts.disableFields) {
      // remove disabledFields
      frmbFields = frmbFields.filter(function(field) {
        return !utils.inArray(field.attrs.type, opts.disableFields);
      });
    }

    var $cbUL = this.createControlBoxDom(frmbFields);

    var cbList = $cbUL.children();
    utils.forEach(cbList, (i) => {
      $(cbList[i]).data('newFieldData', frmbFields[i]);
      $(cbList[i]).data('attrs', frmbFields[i].attrs);
    });

    if (opts.sortableControls) {
      $cbUL.addClass('sort-enabled');
    }

    this.$cbUL = $cbUL;
  };

  Builder.prototype.buildFieldBox = function() {
    var $sortableFields = this.createFieldBoxDom();
    this.lastID = this.frmbID + '-fld-1';
    this.$sortableFields = $sortableFields;
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
          _helpers.setFieldOrderByName($cbUL);
          _helpers.doCancel = !opts.sortableControls;
        }
      }
    });

    $($cbUL).children().click(function() {
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

    Builder.prototype.saveAndUpdate = _helpers.debounce(function(evt) {
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
    $sortableFields.on('change blur keyup', '.form-elements input, .form-elements select, .form-elements textarea', this.saveAndUpdate);
  };

  Builder.prototype.processControl = function(control) {
    this.prepFieldVars(control, true);
  };

  Builder.prototype.render = function() {
    var frmbID = this.frmbID;
    var _helpers = this._helpers;
    var opts = this.opts;
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

    if (opts.showActionButtons) {
      // Build our headers and action links
      let viewDataText = opts.dataType === 'xml' ? opts.messages.viewXML : opts.messages.viewJSON,
        viewData = utils.markup('button', viewDataText, {
          id: frmbID + '-view-data',
          type: 'button',
          className: 'view-data btn btn-default'
        }),
        clearAll = utils.markup('button', opts.messages.clearAll, {
          id: frmbID + '-clear-all',
          type: 'button',
          className: 'clear-all btn btn-default'
        }),
        saveAll = utils.markup('button', opts.messages.save, {
          className: `btn btn-primary ${opts.prefix}save`,
          id: frmbID + '-save',
          type: 'button'
        }),
        formActions = utils.markup('div', [clearAll, viewData, saveAll], {
          className: 'form-actions btn-group'
        });

      cbWrap.append(formActions);
    }

    $stageWrap.append(this.$sortableFields, cbWrap);
    $stageWrap.before($formWrap);
    $formWrap.append($stageWrap, cbWrap);
    $(this.element).append($formWrap);

    this.$stageWrap = $stageWrap;
  };

  Builder.prototype.loadFields = function() {
    var opts = this.opts;
    var $stageWrap = this.$stageWrap;
    var $sortableFields = this.$sortableFields;
    var _helpers = this._helpers;

    let formData = this.formData;
    if (formData && formData.length) {
      for (let i = 0; i < formData.length; i++) {
        this.prepFieldVars(formData[i]);
      }
      $stageWrap.removeClass('empty');
    } else if (opts.defaultFields && opts.defaultFields.length) {
      // Load default fields if none are set
      opts.defaultFields.forEach(field => this.prepFieldVars(field));
      $stageWrap.removeClass('empty');
    } else if (!opts.prepend && !opts.append) {
      $stageWrap.addClass('empty').attr('data-content', opts.messages.getStarted);
    }
    _helpers.save();

    $('li.form-field:not(.disabled)', $sortableFields).each(function() {
      _helpers.updatePreview($(this));
    });
  };

  Builder.prototype.create = function() {

    this.init();
    this.buildControlBox();
    this.buildFieldBox();
    this.render();
    this.bindControlBoxEvents();
    this.bindFieldBoxEvents();
    this.bindEvents();

    if (this.opts.showActionButtons) {
      this.bindActionButtonEvents();
    }

    this._helpers.getData();
    this.loadFields();

    this.$sortableFields.css('min-height', this.$cbUL.height());

    // If option set, controls will remain in view in editor
    if (this.opts.stickyControls) {
      this._helpers.stickyControls(this.$sortableFields, this.$cbUL.get(0));
    }

    document.dispatchEvent(this.events.loaded);
  };

  // override
  Builder.prototype.genFrmbID = function() {};
  Builder.prototype.createControlBoxDom = function(frmbFields) {};
  Builder.prototype.createFieldBoxDom = function() {};
  Builder.prototype.prepFieldVars = function($field, isNew = false) {};
  Builder.prototype.bindEvents = function() {};

  // private 
  Builder.prototype.bindActionButtonEvents = function() {
    var opts = this.opts;
    var frmbID = this.frmbID;
    var _helpers = this._helpers;

    // View XML
    var xmlButton = $(document.getElementById(frmbID + '-view-data'));
    xmlButton.click(function(e) {
      e.preventDefault();
      _helpers.showData();
    });

    // Clear all fields in form editor
    var clearButton = $(document.getElementById(frmbID + '-clear-all'));
    clearButton.click(function() {
      let fields = $('li.form-field');
      let buttonPosition = this.getBoundingClientRect(),
        bodyRect = document.body.getBoundingClientRect(),
        coords = {
          pageX: buttonPosition.left + (buttonPosition.width / 2),
          pageY: (buttonPosition.top - bodyRect.top) - 12
        };

      if (fields.length) {
        _helpers.confirm(opts.messages.clearAllMessage, function() {
          _helpers.removeAllfields();
          opts.notify.success(opts.messages.allFieldsRemoved);
          _helpers.save();
        }, coords);
      } else {
        _helpers.dialog('There are no fields to clear', {pageX: coords.pageX, pageY: coords.pageY});
      }
    });

    // Save Idea Template
    $(document.getElementById(frmbID + '-save')).click(function(e) {
      e.preventDefault();
      _helpers.save();
    });
  };
 
  return Builder;

})(jQuery);