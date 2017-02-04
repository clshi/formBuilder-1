'use strict';

(function($) {
  $.fn.neonFormBuilder = function(options) {
    options = options || {};
    return this.each(function() {
      var formBuilder;
      if(options.type == 'vertical') {
        formBuilder = new neon.VerticalFormBuilder(options, this);  
      } else if(options.type == 'horizontal') {
        formBuilder = new neon.HorizontalFormBuilder(options, this);
      }
      formBuilder.create();
      // create public access api
      var actions = {
        getData: function() { return formBuilder.formData; },
        clearFields: formBuilder._helpers.removeAllfields,
        showData: formBuilder._helpers.showData,
        save: formBuilder._helpers.save,
        addField: (field, index) => {
          formBuilder._helpers.stopIndex = formBuilder.$sortableFields[0].children.length ? index : undefined;
          formBuilder.prepFieldVars(field);
          document.dispatchEvent(formBuilder.events.fieldAdded);
        },
        removeField: formBuilder._helpers.removeField,
        setData: formData => {
          formBuilder._helpers.removeAllfields();
          formBuilder._helpers.getData(formData);
          formBuilder.loadFields();
        }
      };
      $(this).data('formBuilder', actions);
      return actions;
    });
  };
})(jQuery);
