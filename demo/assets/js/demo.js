jQuery(document).ready(function($) {
  var buildWrap = document.querySelector('.build-wrap'),
    renderWrap = document.querySelector('.render-wrap'),
    editBtn = document.getElementById('edit-form'),
    formData = window.sessionStorage.getItem('formData'),
    editing = true,
    fbOptions = {
      dataType: 'json',
      type: 'vertical',
      frmbFields: [{
        label: 'autocomplete',
        attrs: {
          type: 'autocomplete',
          className: 'autocomplete',
          name: 'autocomplete'
        }
      }, {
        label: 'button',
        attrs: {
          type: 'button',
          className: 'button-input',
          name: 'button'
        }
      }],
      sortableControls: true,
      prepend: true
    };

  if (formData) {
    fbOptions.formData = JSON.parse(formData);
  }

  var toggleEdit = function() {
    document.body.classList.toggle('form-rendered', editing);
    editing = !editing;
  };

  var formBuilder = $(buildWrap).neonFormBuilder(fbOptions).data('formBuilder');

  $('.form-builder-save').click(function() {
    toggleEdit();
    $(renderWrap).formRender({
      dataType: 'json',
      formData: formBuilder.formData
    });

    window.sessionStorage.setItem('formData', JSON.stringify(formBuilder.formData));
  });

  editBtn.onclick = function() {
    toggleEdit();
  };
});
