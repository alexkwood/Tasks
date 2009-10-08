// ==========================================================================
// Tasks.importData
// ==========================================================================
/*globals Tasks sc_require */
sc_require('core');
sc_require('mixins/simple_button');
/** @static
    
  @extends SC.Page
  @author Suvajit Gupta
  @author Matt Grantham
  
  Import Data Panel
  
*/
Tasks.loginPage = SC.Page.create({
  
  panel: SC.PanelPane.create({
    layout: { centerX: 0, centerY: 0, height: 296, width: 843 },
    classNames: ['login-page'],
    
    contentView: SC.View.design({
      layout: { top: 0, bottom: 0, left: 0, right: 0 },
      classNames: ['login-body'],
      childViews: 'loginEntry loginErrorMessage cancelButton loginButton signUp'.w(),
      
      loginEntry: SC.TextFieldView.design({
        layout: { top: 139, left: 343, width: 254, height: 26 },
        classNames: ['login-name'],
        valueBinding: 'Tasks.loginController.loginName',
        keyDown: function(evt) {
          if(SC.FUNCTION_KEYS[evt.which] === 'return'){
            this.get('parentView').loginButton.triggerAction(evt);
          }
          return sc_super();
        }
      }),
      
      loginErrorMessage: SC.LabelView.design({
        layout: { top: 112, left: 420, width: 250, height: 20 },
        value: "_LoginError".loc(),
        isVisibleBinding: SC.Binding.oneWay('Tasks.loginController.loginError').bool(),
        classNames: ['error-message']
      }),
      
      cancelButton: SC.ButtonView.design({
        layout: { top: 178, left: 502, width: 80, height: 30 },
        titleMinWidth: 0,
        theme: 'capsule',
        isCancel: YES,
        title: "_Cancel".loc(),
        target: 'Tasks.loginController',
        action: 'cancel'
      }),
      
      loginButton: SC.ButtonView.design({
        layout: { top: 178, left: 588, width: 80, height: 30 },
        titleMinWidth: 0,
        isEnabledBinding: SC.Binding.oneWay('Tasks.loginController.loginName').bool(),
        theme: 'capsule',
        isDefault: YES,
        title: "_Login".loc(),
        target: 'Tasks.loginController',
        action: 'login'
      }),
      
      signUp: SC.LabelView.design(Tasks.SimpleButton,{
        layout: { top: 220, left: 514, height: 24, width: 200 },
        classNames: ['sign-up'],
        value: "_SignupLabelButton".loc(),
        target: 'Tasks',
        action: 'launchSignupPane'
      })
      
    }),
      
    focus: function() {
      this.contentView.loginEntry.becomeFirstResponder();        
    }
    
  })
    
});