'use strict';

window.neon.VerticalFormBuilder = (function($) {
  var utils = fbUtils;	 
  var VerticalFormBuilder = fbUtils.extend(neon.Builder, {
  	genFrmbID: function() {
  	  var type = this.opts.type;
  	  return 'frmb-' + type + '-' + $('ul[id^=frmb-' + type + ']-').length++;
  	},
  	createControlBoxDom: function(frmbFields) {
  		var boxID = this.frmbID + '-control-box';
  		// Create draggable fields for formBuilder
    	var cbUL = utils.markup('ul', null, {id: boxID, className: 'frmb-control'});
    	var $cbUL = $(cbUL);
	    // Loop through
	    utils.forEach(frmbFields, (i) => {
	      let $field = $('<li/>', {
	        'class': 'icon-' + frmbFields[i].attrs.className,
	        'type': frmbFields[i].attrs.type,
	        'name': frmbFields[i].attrs.name,
	        'label': frmbFields[i].label
	      });

	      let typeLabel = utils.markup('span', frmbFields[i].label);
	      $field.html(typeLabel).appendTo($cbUL);
	    });

	    return $cbUL;
  	},
  	createFieldBoxDom: function() {
  		return $('<ul/>').attr('id', this.frmbID).addClass('frmb');
  	},
  	prepFieldVars: function($field, isNew = false) {
  		var field = {};
      if ($field instanceof jQuery) {
        let fieldData = $field.data('newFieldData');
        if (fieldData) {
          field = fieldData.attrs;
          field.label = fieldData.label;
        } else {
          let attrs = $field[0].attributes;
          if (!isNew) {
            field.values = $field.children().map((index, elem) => {
              return {
                label: $(elem).text(),
                value: $(elem).attr('value'),
                selected: Boolean($(elem).attr('selected'))
              };
            });
          }

          for (var i = attrs.length - 1; i >= 0; i--) {
            field[attrs[i].name] = attrs[i].value;
          }
        }
      } else {
        field = Object.assign({}, $field);
      }

      // field.name = isNew ? this.nameAttr(field) : ( field.name || this.nameAttr(field) );

      if (isNew && utils.inArray(field.type, ['text', 'number', 'file', 'select', 'textarea'])) {
        field.className = 'form-control'; // backwards compatibility
      } else {
        field.className = field.class || field.className; // backwards compatibility
      }

      var match = /(?:^|\s)btn-(.*?)(?:\s|$)/g.exec(field.className);
      if (match) {
        field.style = match[1];
      }

      utils.escapeAttrs(field);

      this.appendNewField(field);
      if (isNew) {
        document.dispatchEvent(this.events.fieldAdded);
      }
      this.$stageWrap.removeClass('empty');
  	}
  });

  VerticalFormBuilder.prototype.appendNewField = function(values) {
  	var opts = this.opts;
  	var lastID = this.lastID;
  	var _helpers = this._helpers;
  	var $sortableFields = this.$sortableFields;
  	let type = values.type || 'text',
      label = values.label || opts.messages[type] || opts.messages.label,
      delBtn = utils.markup('a', opts.messages.remove, {
        id: 'del_' + lastID,
        className: 'del-button btn delete-confirm',
        title: opts.messages.removeMessage
      }),
      toggleBtn = utils.markup('a', null, {
        id: lastID + '-edit',
        className: 'toggle-form btn icon-pencil',
        title: opts.messages.hide
      }),
      copyBtn = utils.markup('a', opts.messages.copyButton, {
        id: lastID + '-copy',
        className: 'copy-button btn icon-copy',
        title: opts.messages.copyButtonTooltip
      });

    var liContents = utils.markup(
      'div', [toggleBtn, copyBtn, delBtn], {className: 'field-actions'}
    ).outerHTML;

    // Field preview Label
    liContents += `<label class="field-label">${label}</label>`;

    if (values.description) {
      liContents += `<span class="tooltip-element" tooltip="${values.description}">?</span>`;
    }

    let requiredDisplay = values.required ? 'style="display:inline"' : '';
    liContents += `<span class="required-asterisk" ${requiredDisplay}> *</span>`;

    liContents += utils.markup('div', '', {className: 'prev-holder'}).outerHTML;
    liContents += '<div id="' + lastID + '-holder" class="frm-holder">';
    liContents += '<div class="form-elements">';

    liContents += this.advFields(values);
    liContents += utils.markup('a', opts.messages.close, {className: 'close-field'}).outerHTML;

    liContents += '</div>';
    liContents += '</div>';

    let field = utils.markup('li', liContents, {
	      'class': type + '-field form-field',
	      'type': type,
	      id: lastID
	    }),
	    $li = $(field);

    $li.data('fieldData', {attrs: values});
    if (typeof _helpers.stopIndex !== 'undefined') {
      $($sortableFields).children().eq(_helpers.stopIndex).before($li);
    } else {
      $sortableFields.append($li);
    }

    $('.sortable-options', $li).sortable({update: () => {_helpers.updatePreview($li);}}); // make dynamically added option fields sortable if they exist.

    _helpers.updatePreview($li);

    if (opts.editOnAdd) {
      _helpers.closeAllEdit($sortableFields);
      _helpers.toggleEdit(lastID);
    }

    this.lastID = _helpers.incrementId(lastID);
  };

  /**
   * Build the editable properties for the field
   * @param  {object} values configuration object for advanced fields
   * @return {String}        markup for advanced fields
   */
  VerticalFormBuilder.prototype.advFields = function(values) {
  	var opts = this.opts;
  	var lastID = this.lastID;

	  var advFields = [],
      key,
      optionFields = [
        'select',
        'checkbox-group',
        'radio-group'
      ],
      isOptionField = (function() {
        return (optionFields.indexOf(values.type) !== -1);
      })(),
      valueField = !utils.inArray(values.type, ['header', 'paragraph', 'file'].concat(optionFields)),
      roles = values.role !== undefined ? values.role.split(',') : [];

    advFields.push(this.requiredField(values));
    advFields.push(this.boolAttribute('hidden', values, {first: opts.messages.hidden}));

    /*if (values.type === 'checkbox') {
      advFields.push(this.boolAttribute('toggle', values, {first: opts.messages.toggle}));
    }*/

    advFields.push(this.textAttribute('label', values));

    values.size = values.size || 'm';
    values.style = values.style || 'default';

    //Help Text / Description Field
    if (!utils.inArray(values.type, ['header', 'paragraph', 'button'])) {
      advFields.push(this.textAttribute('description', values));
    }

    /*if (opts.messages.subtypes[values.type]) {
      let optionData = opts.messages.subtypes[values.type];
      advFields.push(this.selectAttribute('subtype', values, optionData));
    }*/

    if (values.type === 'button') {
      advFields.push(this.btnStyles(values.style, values.type));
    }

    if (values.type === 'number') {
      advFields.push(this.numberAttribute('min', values));
      advFields.push(this.numberAttribute('max', values));
      advFields.push(this.numberAttribute('step', values));
    }

    // Placeholder
    advFields.push(this.textAttribute('placeholder', values));

    //TextArea Rows Attribute
    /*if (values.type === 'textarea') {
      advFields.push(this.numberAttribute('rows', values));
    }*/

    // Class
    advFields.push(this.textAttribute('className', values));

    advFields.push(this.textAttribute('name', values));

    if (valueField) {
      advFields.push(this.textAttribute('value', values));
    }

    if (values.type === 'file') {
      let labels = {
        first: opts.messages.multipleFiles,
        second: opts.messages.allowMultipleFiles
      };
      advFields.push(this.boolAttribute('multiple', values, labels));
    }

    /*let rolesDisplay = values.role !== undefined ? 'style="display:block"' : '';
    let availableRoles = [
      `<div class="available-roles" ${rolesDisplay}>`
    ];
    for (key in opts.roles) {
      if (opts.roles.hasOwnProperty(key)) {
        let checked = utils.inArray(key, roles) ? 'checked' : '',
        roleId = `fld-${lastID}-roles-${key}`;
        availableRoles.push(`<input type="checkbox" name="roles[]" value="${key}" id="${roleId}" ${checked} class="roles-field" /> <label for="${roleId}">${opts.roles[key]}</label><br/>`);
      }
    }

    availableRoles.push('</div>');

    let accessLabels = {first: opts.messages.roles, second: opts.messages.limitRole, content: availableRoles.join('')};

    advFields.push(this.boolAttribute('access', values, accessLabels));*/

    /*if (values.type === 'checkbox-group' || values.type === 'radio-group') {
      advFields.push(this.boolAttribute('other', values, {first: opts.messages.enableOther, second: opts.messages.enableOtherMsg}));
    }*/

    /*if (values.type === 'select') {
      advFields.push(this.boolAttribute('multiple', values, {first: ' ', second: opts.messages.selectionsMessage}));
    }*/

    if (isOptionField) {
      advFields.push(this.fieldOptions(values));
    }

    /*if (utils.inArray(values.type, ['text', 'textarea'])) {
      advFields.push(this.numberAttribute('maxlength', values));
    }*/

    return advFields.join('');
  };

  VerticalFormBuilder.prototype.boolAttribute = function(name, values, labels) {
  	var lastID = this.lastID;
    let label = (txt) => {
      return `<label for="${name}-${lastID}">${txt}</label>`;
    },
    checked = (values[name] !== undefined ? 'checked' : ''),
    input = `<input type="checkbox" class="fld-${name}" name="${name}" value="true" ${checked} id="${name}-${lastID}"/> `,
    left = [],
    right = [
      input
    ];

    if (labels.first) {
      left.unshift(label(labels.first));
    }

    if (labels.second) {
      right.push(label(labels.second));
    }

    if (labels.content) {
      right.push(labels.content);
    }

    right.unshift('<div class="input-wrap">');
    right.push('</div>');

    return `<div class="form-group ${name}-wrap">${left.concat(right).join('')}</div>`;
  };

  VerticalFormBuilder.prototype.btnStyles = function(style, type) {
  	var opts = this.opts;
    let tags = {
        button: 'btn'
      },
      styles = opts.messages.styles[tags[type]],
      styleField = '';

    if (styles) {
      let styleLabel = `<label>${opts.messages.style}</label>`;
      styleField += `<input value="${style}" name="style" type="hidden" class="btn-style">`;
      styleField += '<div class="btn-group" role="group">';

      Object.keys(opts.messages.styles[tags[type]]).forEach(function(element) {
        let active = style === element ? 'active' : '';
        styleField += `<button value="${element}" type="${type}" class="${active} btn-xs ${tags[type]} ${tags[type]}-${element}">${opts.messages.styles[tags[type]][element]}</button>`;
      });

      styleField += '</div>';

      styleField = `<div class="form-group style-wrap">${styleLabel} ${styleField}</div>`;
    }

    return styleField;
  };

  /**
   * Add a number attribute to a field.
   * @param  {String} attribute
   * @param  {Object} values
   * @return {String}
   */
  VerticalFormBuilder.prototype.numberAttribute = function(attribute, values) {
  	var opts = this.opts;
  	var lastID = this.lastID;
    let attrVal = values[attribute],
      attrLabel = opts.messages[attribute] || attribute,
      placeholder = opts.messages.placeholders[attribute],
      inputConfig = {
        type: 'number',
        value: attrVal,
        name: attribute,
        min: '0',
        placeholder: placeholder,
        className: `fld-${attribute} form-control`,
        id: `${attribute}-${lastID}`
      },
      numberAttribute = `<input ${utils.attrString(utils.trimObj(inputConfig))}>`,
      inputWrap = `<div class="input-wrap">${numberAttribute}</div>`;

    return `<div class="form-group ${attribute}-wrap"><label for="${inputConfig.id}">${attrLabel}</label> ${inputWrap}</div>`;
  };

  VerticalFormBuilder.prototype.selectAttribute = function(attribute, values, optionData) {
  	var opts = this.opts;
  	var lastID = this.lastID;

    let selectOptions = optionData.map((option, i) => {
      let optionAttrs = Object.assign({
        label: `${opts.messages.option} ${i}`,
        value: undefined
      }, option);
      if (option.value === values[attribute]) {
        optionAttrs.selected = true;
      }
      return `<option ${utils.attrString(utils.trimObj(optionAttrs))}>${optionAttrs.label}</option>`;
    }),
      selectAttrs = {
        id: attribute + '-' + lastID,
        name: attribute,
        className: `fld-${attribute} form-control`
      },
      label = `<label for="${selectAttrs.id}">${opts.messages[attribute] || utils.capitalize(attribute)}</label>`;

    let select = `<select ${utils.attrString(selectAttrs)}>${selectOptions.join('')}</select>`,
      inputWrap = `<div class="input-wrap">${select}</div>`;

    return `<div class="form-group ${selectAttrs.name}-wrap">${label}${inputWrap}</div>`;
  };

  /**
   * Generate some text inputs for field attributes, **will be replaced**
   * @param  {String} attribute
   * @param  {Object} values
   * @return {String}
   */
  VerticalFormBuilder.prototype.textAttribute = function(attribute, values) {
  	var opts = this.opts;
  	var lastID = this.lastID;

    var placeholderFields = [
      'text',
      'textarea',
      'select'
    ];

    var noName = [
      'header'
    ];

    var textArea = ['paragraph'];

    var attrVal = values[attribute] || '',
      attrLabel = opts.messages[attribute];
    if (attribute === 'label' && utils.inArray(values.type, textArea)) {
      attrLabel = opts.messages.content;
    }

    noName = noName.concat(opts.messages.subtypes.header, textArea);

    let placeholders = opts.messages.placeholders,
      placeholder = placeholders[attribute] || '',
      attributefield = '',
      noMakeAttr = [];

    // Field has placeholder attribute
    if (attribute === 'placeholder' && !utils.inArray(values.type, placeholderFields)) {
      noMakeAttr.push(true);
    }

    // Field has name attribute
    if (attribute === 'name' && utils.inArray(values.type, noName)) {
      noMakeAttr.push(true);
    }

    if (!noMakeAttr.some(elem => elem === true)) {
      let inputConfig = {
        name: attribute,
        placeholder: placeholder,
        className: `fld-${attribute} form-control`,
        id: `${attribute}-${lastID}`
      };
      let attributeLabel = `<label for="${inputConfig.id}">${attrLabel}</label>`;

      if (attribute === 'label' && utils.inArray(values.type, textArea) || (attribute === 'value' && values.type === 'textarea')) {
        attributefield += `<textarea ${utils.attrString(inputConfig)}>${attrVal}</textarea>`;
      } else {
        inputConfig.value = attrVal;
        inputConfig.type = 'text';
        attributefield += `<input ${utils.attrString(inputConfig)}>`;
      }

      let inputWrap = `<div class="input-wrap">${attributefield}</div>`;

      if(attribute === 'name' || attribute === 'className') {
      	attributefield = `<div class="form-group ${attribute}-wrap" style="display:none;">${attributeLabel} ${inputWrap}</div>`;
      } else {
      	attributefield = `<div class="form-group ${attribute}-wrap">${attributeLabel} ${inputWrap}</div>`;	
      }
    }

    return attributefield;
  };

  VerticalFormBuilder.prototype.requiredField = function(values) {
  	var opts = this.opts;

    var noRequire = [
        'header',
        'paragraph',
        'button'
      ],
      noMake = [],
      requireField = '';

    if (utils.inArray(values.type, noRequire)) {
      noMake.push(true);
    }
    if (!noMake.some(elem => elem === true)) {
      requireField = this.boolAttribute('required', values, {first: opts.messages.required});
    }

    return requireField;
  };

  /**
   * Add data for field with options [select, checkbox-group, radio-group]
   *
   * @todo   refactor this nasty ~crap~ code, its actually painful to look at
   * @param  {object} values
   */
  VerticalFormBuilder.prototype.fieldOptions = function(values) {
  	var opts = this.opts;
  	var formBuilder = this;

    let optionActions = [
        utils.markup('a', opts.messages.addOption, {className: 'add add-opt'})
      ],
      fieldOptions = [`<label class="false-label">${opts.messages.selectOptions}</label>`],
      isMultiple = values.multiple || (values.type === 'checkbox-group');

    if (!values.values || !values.values.length) {
      values.values = [1, 2, 3].map(function(index) {
        let label = `${opts.messages.option} ${index}`;
        let option = {
          selected: false,
          label: label,
          value: utils.hyphenCase(label)
        };
        return option;
      });
      values.values[0].selected = true;
    } else {
      // ensure option data is has all required keys
      values.values.forEach(option => Object.assign({}, {selected: false}, option));
    }

    fieldOptions.push('<div class="sortable-options-wrap">');

    fieldOptions.push('<ol class="sortable-options">');
    utils.forEach(values.values, (i) => {
      fieldOptions.push(formBuilder.selectFieldOptions(values.name, values.values[i], isMultiple));
    });
    fieldOptions.push('</ol>');
    fieldOptions.push(utils.markup('div', optionActions, {className: 'option-actions'}).outerHTML);
    fieldOptions.push('</div>');

    return utils.markup('div', fieldOptions.join(''), {className: 'form-group field-options'}).outerHTML;
  };

  // Select field html, since there may be multiple
  VerticalFormBuilder.prototype.selectFieldOptions = function(name, optionData, multipleSelect) {
  	var opts = this.opts;

    let optionInputType = {
        selected: (multipleSelect ? 'checkbox' : 'radio')
      },
      optionDataOrder = [
        'value',
        'label',
        'selected'
      ],
      optionInputs = [];

    optionData = Object.assign({selected: false,label: '',value: ''}, optionData);

    for (var i = optionDataOrder.length - 1; i >= 0; i--) {
      let prop = optionDataOrder[i];
      if (optionData.hasOwnProperty(prop)) {
        let attrs = {
          type: optionInputType[prop] || 'text',
          'class': 'option-' + prop,
          value: optionData[prop],
          name: name + '-option'
        };

        if (opts.messages.placeholders[prop]) {
          attrs.placeholder = opts.messages.placeholders[prop];
        }

        if (prop === 'selected' && optionData.selected === true) {
          attrs.checked = optionData.selected;
        }

        optionInputs.push(utils.markup('input', null, attrs));
      }
    }

    let removeAttrs = {
      className: 'remove btn',
      title: opts.messages.removeMessage
    };
    optionInputs.push(utils.markup('a', opts.messages.remove, removeAttrs));

    let field = utils.markup('li', optionInputs);

    return field.outerHTML;
  };

  VerticalFormBuilder.prototype.cloneItem = function(currentItem) {
  	var lastID = this.lastID;
  	var opts = this.opts;
  	var _helpers = this._helpers;

    let currentId = currentItem.attr('id'),
      type = currentItem.attr('type'),
      ts = new Date().getTime(),
      cloneName = type + '-' + ts;

    var $clone = currentItem.clone();

    $clone.find('[id]').each(function() { this.id = this.id.replace(currentId, lastID); });

    $clone.find('[for]').each(function() { this.setAttribute('for', this.getAttribute('for').replace(currentId, lastID)); });

    $clone.each(function() {
      $('e:not(.form-elements)').each(function() {
        var newName = this.getAttribute('name');
        newName = newName.substring(0, (newName.lastIndexOf('-') + 1));
        newName = newName + ts.toString();
        this.setAttribute('name', newName);
      });

    });

    $clone.find('.form-elements').find(':input').each(function() {
      if (this.getAttribute('name') === 'name') {
        var newVal = this.getAttribute('value');
        newVal = newVal.substring(0, (newVal.lastIndexOf('-') + 1));
        newVal = newVal + ts.toString();
        this.setAttribute('value', newVal);
      }
    });

    $clone.attr('id', lastID);
    $clone.attr('name', cloneName);
    $clone.addClass('cloned');
    $('.sortable-options', $clone).sortable();

    this.lastID = _helpers.incrementId(lastID);
    return $clone;
  };

  
  VerticalFormBuilder.prototype.bindEvents = function() {
  	var formBuilder = this;
  	var opts = this.opts;
  	var _helpers = this._helpers;
  	var $sortableFields = this.$sortableFields;

  	// ---------------------- UTILITIES ---------------------- //

  	// delete options
    $sortableFields.on('click touchstart', '.remove', function(e) {
      var $field = $(this).parents('.form-field:eq(0)');
      e.preventDefault();
      var optionsCount = $(this).parents('.sortable-options:eq(0)').children('li').length;
      if (optionsCount <= 2) {
        opts.notify.error('Error: ' + opts.messages.minOptionMessage);
      } else {
        $(this).parent('li').slideUp('250', function() {
          $(this).remove();
          _helpers.updatePreview($field);
          _helpers.save();
        });
      }
    });

    // touch focus
    $sortableFields.on('touchstart', 'input', function(e) {
      if (e.handled !== true) {
        if ($(this).attr('type') === 'checkbox') {
          $(this).trigger('click');
        } else {
          $(this).focus();
          let fieldVal = $(this).val();
          $(this).val(fieldVal);
        }
      } else {
        return false;
      }
    });

    // toggle fields
    $sortableFields.on('click touchstart', '.toggle-form, .close-field', function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (e.handled !== true) {
        var targetID = $(this).parents('.form-field:eq(0)').attr('id');
        _helpers.toggleEdit(targetID);
        e.handled = true;
      } else {
        return false;
      }
    });

    $sortableFields.on('change', '.prev-holder input, .prev-holder select', e => {
      if (e.target.classList.contains('other-option')) {
        return;
      }
      let field = $(e.target).closest('li.form-field')[0];
      if (utils.inArray(field.type, ['select', 'checkbox-group', 'radio-group'])) {
        field.querySelector('[class="option-value"][value="' + e.target.value + '"]').parentElement.childNodes[0].checked = true;
      } else {
        document.getElementById('value-' + field.id).value = e.target.value;
      }

      _helpers.save();
    });

    // update preview to label
    $sortableFields.on('keyup change', '[name="label"]', function() {
      $('.field-label', $(this).closest('li')).text($(this).val());
    });

    // remove error styling when users tries to correct mistake
    $sortableFields.delegate('input.error', 'keyup', function() {
      $(this).removeClass('error');
    });

    // update preview for description
    $sortableFields.on('keyup', 'input[name="description"]', function() {
      var $field = $(this).parents('.form-field:eq(0)');
      var closestToolTip = $('.tooltip-element', $field);
      var ttVal = $(this).val();
      if (ttVal !== '') {
        if (!closestToolTip.length) {
          var tt = '<span class="tooltip-element" tooltip="' + ttVal + '">?</span>';
          $('.field-label', $field).after(tt);
        } else {
          closestToolTip.attr('tooltip', ttVal).css('display', 'inline-block');
        }
      } else {
        if (closestToolTip.length) {
          closestToolTip.css('display', 'none');
        }
      }
    });

    $sortableFields.on('change', '.fld-multiple', e => {
      let newType = e.target.checked ? 'checkbox' : 'radio';

      $(e.target)
      .parents('.form-elements:eq(0)')
      .find('.sortable-options input.option-selected')
      .each(function() {
        this.type = newType;
      });

    });

    // format name attribute
    $sortableFields.on('blur', 'input.fld-name', function() {
      this.value = _helpers.safename(this.value);
      if (this.value === '') {
        $(this).addClass('field-error').attr('placeholder', opts.messages.cannotBeEmpty);
      } else {
        $(this).removeClass('field-error');
      }
    });

    $sortableFields.on('blur', 'input.fld-maxlength', function() {
      this.value = _helpers.forceNumber(this.value);
    });

    // Copy field
    $sortableFields.on('click touchstart', '.icon-copy', function(e) {
      e.preventDefault();
      var currentItem = $(this).parent().parent('li');
      var $clone = formBuilder.cloneItem(currentItem);
      $clone.insertAfter(currentItem);
      _helpers.updatePreview($clone);
      _helpers.save();
    });

    // Delete field
    $sortableFields.on('click touchstart', '.delete-confirm', function(e) {
      e.preventDefault();

      let buttonPosition = this.getBoundingClientRect(),
        bodyRect = document.body.getBoundingClientRect(),
        coords = {
          pageX: buttonPosition.left + (buttonPosition.width / 2),
          pageY: (buttonPosition.top - bodyRect.top) - 12
        };

      var deleteID = $(this).parents('.form-field:eq(0)').attr('id'),
        $field = $(document.getElementById(deleteID));

      document.addEventListener('modalClosed', function() {
        $field.removeClass('deleting');
      }, false);

      // Check if user is sure they want to remove the field
      if (opts.fieldRemoveWarn) {
        let warnH3 = utils.markup('h3', opts.messages.warning),
          warnMessage = utils.markup('p', opts.messages.fieldRemoveWarning);
        _helpers.confirm([warnH3, warnMessage], () => _helpers.removeField(deleteID), coords);
        $field.addClass('deleting');
      } else {
        _helpers.removeField(deleteID);
      }
    });

    // Update button style selection
    $sortableFields.on('click', '.style-wrap button', function() {
      let styleVal = $(this).val(),
        $parent = $(this).parent(),
        $btnStyle = $parent.prev('.btn-style');
      $btnStyle.val(styleVal);
      $(this).siblings('.btn').removeClass('active');
      $(this).addClass('active');
      formBuilder.saveAndUpdate.call($parent);
    });

    // Attach a callback to toggle required asterisk
    $sortableFields.on('click', 'input.fld-required', function() {
      var requiredAsterisk = $(this).parents('li.form-field').find('.required-asterisk');
      requiredAsterisk.toggle();
    });

    // Attach a callback to toggle roles visibility
    $sortableFields.on('click', 'input.fld-access', function() {
      var roles = $(this).parents('li.form-field').find('div.available-roles'),
        enableRolesCB = $(this);
      roles.slideToggle(250, function() {
        if (!enableRolesCB.is(':checked')) {
          $('input[type="checkbox"]', roles).removeAttr('checked');
        }
      });
    });

    // Attach a callback to add new options
    $sortableFields.on('click', '.add-opt', function(e) {
      e.preventDefault();
      var $optionWrap = $(this).parents('.field-options:eq(0)'),
        $multiple = $('[name="multiple"]', $optionWrap),
        $firstOption = $('.option-selected:eq(0)', $optionWrap),
        isMultiple = false;

      if ($multiple.length) {
        isMultiple = $multiple.prop('checked');
      } else {
        isMultiple = ($firstOption.attr('type') === 'checkbox');
      }

      let name = $firstOption.attr('name');

      $('.sortable-options', $optionWrap).append(formBuilder.selectFieldOptions(name, false, isMultiple));
    });

    $sortableFields.on('mouseover mouseout', '.remove, .del-button', function() {
      $(this).parents('li:eq(0)').toggleClass('delete');
    });
  };

  VerticalFormBuilder.prototype.init = function() {
  	VerticalFormBuilder.superclass.init.call(this);
  	var opts = this.opts;
  	// add class based on field type
  	var typeClassMapping = {
  		'text': 'text-input',
  		'number': 'number',
  		'select': 'select',
  		'checkbox': 'checkbox',
  		'checkbox-group': 'checkbox-group',
  		'radio-group': 'radio-group',
  		'textarea': 'text-area',
  		'date': 'calendar',
  		'file': 'file-input',
  		'button': 'button-input'
  	};
  	utils.forEach(opts.frmbFields, (i) => {
  		opts.frmbFields[i].attrs.className = typeClassMapping[opts.frmbFields[i].attrs.type];
  	});
  };

  return VerticalFormBuilder;	
})(jQuery);
  