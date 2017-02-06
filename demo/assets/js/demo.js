jQuery(document).ready(function($) {
  var buildWrap = document.querySelector('.build-wrap'),
    renderWrap = document.querySelector('.render-wrap'),
    fbOptions = {
      dataType: 'json',
      type: 'vertical',
      frmbFields: [{
        label: 'First Name',
        attrs: {
          type: 'text',
          name: 'firstName',
          required: true,
          description: 'aa'
        }
      }, {
        label: 'Last Name',
        attrs: {
          type: 'text',
          name: 'lastName',
          required: true
        }
      }, {
        label: 'Amount',
        attrs: {
          type: 'text',
          name: 'amount',
          value: '10'
        }
      }, {
        label: 'Agent',
        attrs: {
          type: 'select',
          name: 'agent',
          values: [
            {
              "label": "A1",
              "value": "a-1"
            },
            {
              "label": "A 2",
              "value": "a-2",
              "selected": true
            },
            {
              "label": "A 3",
              "value": "a-3"
            }
          ]
        }
      }, {
        label: 'Notify me',
        attrs: {
          type: 'checkbox',
          name: 'notify'
        }
      }, {
        label: 'Favourite',
        attrs: {
          type: 'checkbox-group',
          name: 'favourite',
          values: [
            {
              "label": "Apple",
              "value": "1"
            },
            {
              "label": "Grape",
              "value": "2"
            }
          ]
        }
      }, {
        label: 'Gender',
        attrs: {
          type: 'radio-group',
          name: 'gender',
          values: [
            {
              "label": "Male",
              "value": "1"
            },
            {
              "label": "Female",
              "value": "0",
              "selected": true
            }
          ] 
        }
      }, {
        label: 'Feedback',
        attrs: {
          type: 'textarea',
          name: 'feedback'
        }
      }],
      sortableControls: true,
      editOnAdd: false,
      stickyControls: true
    };




  var formBuilder = $(buildWrap).neonFormBuilder(fbOptions).data('formBuilder');

  $('.neon-form-builder-save').click(function() {
    window.sessionStorage.setItem('formData', JSON.stringify(formBuilder.getData()));
  });


  if(window.sessionStorage.getItem('formData')) {
    formBuilder.setData(JSON.parse(window.sessionStorage.getItem('formData')));  
  }

  // load data 
/*  var data = [{
    "type": "radio-group",
    "name": "gender",
    "label": "Gender",
    "className": "radio-group",
    "values": [
      {
        "label": "hh",
        "value": "1",
        "selected": true
      },
      {
        "label": "xx",
        "value": "0"
      }
    ]
  }];
  formBuilder.setData(JSON.stringify(data));*/
});
