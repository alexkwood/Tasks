/**
 * A mixin that defines all of the state transitions.
 *
 * @author Suvajit Gupta
 * License: Licened under MIT license (see license.js)
 */
/*globals Tasks Ki sc_require */
sc_require('core');

Tasks.mixin({
  
  // TODO: [SG/MC] make default responder work instead of having to specify in each panel
  
  statechart: Ki.Statechart.create({

    // Set tracing on to debug statecharts
    trace: NO,
    
    rootState: Ki.State.design({

      initialSubstate: 'loggedOut',

      // State when user hasn't logged in yet
      loggedOut: Ki.State.design({

        initialSubstate: 'logIn',
        
        // State prompting an existing user to log in
        logIn: Ki.State.design({
          
          enterState: function() {
            Tasks.loginController.openPanel();
          },

          login: function() {
            Tasks.loginController.login();
          },

          signup: function() {
            Tasks.statechart.gotoState('signUp');
          },

          exitState: function() {
            Tasks.loginController.closePanel();
          }

        }),

        // State prompting a new guest user to sign up
        signUp: Ki.State.design({
          
          enterState: function() {
            Tasks.signupController.openPanel();
          },

          signup: function() {
            Tasks.signupController.signup();
          },

          cancel: function() {
            Tasks.signupController.cancel();
          },

          exitState: function() {
            Tasks.signupController.closePanel();
          }

        })
        
      }),

      // State after user logs in and the application is ready to use
      loggedIn: Ki.State.design({

        enterState: function() {
          Tasks.loadData();
          Tasks.getPath('mainPage.mainPane.projectsList').becomeFirstResponder();
        },

        logout: function() {
          Tasks.logout();
        }
        
      }),

      // State after application is shut down
      terminated: Ki.State.design({
        
        enterState: function() {
          Tasks.getPath('mainPage.mainPane').remove();
        }
        
      })

    })

  })

});