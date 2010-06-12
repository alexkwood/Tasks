// ==========================================================================
// Project: Tasks 
// ==========================================================================
/*globals CoreTasks Tasks sc_require SCUI sc_static */
sc_require('mixins/localized_label');

/** 

  Used as exampleView for project information display in the main workspace.
  
  @extends SC.ListItemView
  @author Suvajit Gupta
*/

// TODO: [SG] Move to project model as a computed property
var TasksProjectHelper = SC.Object.create({
  
  timeLeftMode: true,

  targetDateMode: function(key, value) {
    if (value !== undefined) this.set('timeLeftMode', !value);
    else value = !this.get('timeLeftMode');
    return value;
  }.property('timeLeftMode')
    
});

Tasks.ProjectItemView = SC.ListItemView.extend(Tasks.LocalizedLabel,
/** @scope Tasks.ProjectItemView.prototype */ {
  
  displayProperties: ['displayName', 'displayTimeLeft', 'description'],
  
  _listStatuses: function() {
     var ret = [];
     ret.push({ name: CoreTasks.STATUS_PLANNED, value: CoreTasks.STATUS_PLANNED });
     ret.push({ name: CoreTasks.STATUS_ACTIVE, value: CoreTasks.STATUS_ACTIVE });
     ret.push({ name: CoreTasks.STATUS_DONE, value: CoreTasks.STATUS_DONE });
     return ret;
  },

  /** @private
    If mouse was down over Description Icon open the editor.
  */  
  mouseDown: function(event) {
    
    // console.log('DEBUG: mouse down on project item: ' + this.getPath('content.name'));

    var content = this.get('content');
    if(!content.get('id')) return sc_super();

    this.set('isSystemProject', CoreTasks.isSystemProject(content));
    
    // See what user clicked on
    var classes = event.target.className;
    // console.log('DEBUG: classes = "' + classes + '"');
    var sel = Tasks.getPath('projectsController.selection');
    var singleSelect = (sel && sel.get('length') === 1);
    
    if ((!event.which || event.which === 1) && singleSelect && classes !== "") { // left click with one project selected and didn't click on the inline editable name
      this.popupEditor();
    }

    return NO;
  },
  
  popupEditor: function() {
    var layer = this.get('layer');
    var that = this;
    
    this._editorPane = SCUI.ResizablePickerPane.create({
      
      minWidth: 700,
      minHeight: 200,
      layout: { width: 740, height: 265 },
      _timeLeft: null,
      
      // Avoid popup panel coming up for system projects
      popup: function() {
        if(that.get('isSystemProject')) return;
        sc_super();
        Tasks.editorPoppedUp = true;
        this._timeLeft = that.getPath('content.timeLeft');
        var name = that.getPath('content.name');
        var copyPattern = new RegExp("_Copy".loc() + '$');
        if((name === CoreTasks.NEW_PROJECT_NAME.loc() || copyPattern.exec(name)) && CoreTasks.getPath('permissions.canUpdateProject')) {
          this.getPath('contentView.nameField').becomeFirstResponder();
        }
      },
      remove: function() {
        sc_super();
        Tasks.editorPoppedUp = false;
        var content = that.get('content');
        var cv = that._editorPane.get('contentView');
        content.setIfChanged('displayName', cv.getPath('nameField.value'));
        content.setIfChanged('timeLeftValue', cv.getPath('timeLeftField.value'));
        content.setIfChanged('description',  cv.getPath('descriptionField.value'));
        if(Tasks.sourcesRedrawNeeded) Tasks.projectsController.showSources();
        // If timeLeft has changed, recalculate load balancing
        if(this._timeLeft !== that.getPath('content.timeLeft')) Tasks.assignmentsController.showAssignments();
        if(CoreTasks.get('autoSave')) Tasks.saveData();
      },
      
      contentView: SC.View.design({
        layout: { left: 0, right: 0, top: 0, bottom: 0},
        childViews: 'nameLabel nameField  statusLabel statusField targetDateTimeLeftRadiobuttons timeLeftField timeLeftHelpLabel descriptionLabel descriptionField createdAtLabel updatedAtLabel'.w(),
        // childViews: 'nameLabel nameField  statusLabel statusField targetDateTimeLeftRadiobuttons timeLeftField timeLeftHelpLabel targetDateField descriptionLabel descriptionField createdAtLabel updatedAtLabel'.w(),
      
        nameLabel: SC.LabelView.design({
          layout: { top: 6, left: 10, height: 24, width: 45 },
          value: "_Name".loc()
        }),
        nameField: SC.TextFieldView.design({
          layout: { top: 5, left: 55, right: 200, height: 24 },
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          value: that.getPath('content.name')
        }),
        
        statusLabel: SC.LabelView.design({
          layout: { top: 7, right: 113, height: 24, width: 50 },
          textAlign: SC.ALIGN_RIGHT,
          value: "_Status".loc()
        }),
        statusField: SC.SelectButtonView.design({
          layout: { top: 5, right: 10, height: 24, width: 125 },
          classNames: ['square'],
          localize: YES,
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          objects: this._listStatuses(),
          nameKey: 'name',
          valueKey: 'value',
          valueBinding: SC.binding('.content.statusValue', this),
          toolTip: "_StatusTooltip".loc()
        }),

        targetDateTimeLeftRadiobuttons: SC.RadioView.design({
          layout: { top: 40, left: 150, height: 40, width: 110 },
          layoutDirection: SC.LAYOUT_VERTICAL,
          items: [
            { title: "_TimeLeft:".loc(), value: true }
            // { title: "_TargetDate:".loc(), value: false }
          ],
          itemTitleKey: 'title',
          itemValueKey: 'value',
          valueBinding: 'TasksProjectHelper.timeLeftMode'
        }),
        timeLeftField: SC.TextFieldView.design({
          layout: { top: 35, left: 250, width: 125, height: 24 },
          isEnabledBinding: SC.Binding.logicalAnd('CoreTasks.permissions.canUpdateProject', 'TasksProjectHelper.timeLeftMode'),
          value: that.getPath('content.timeLeft')
        }),
        timeLeftHelpLabel: SC.LabelView.design({
          layout: { top: 40, left: 380, height: 20, right: 10 },
          escapeHTML: NO,
          classNames: [ 'onscreen-help'],
          value: "_TimeLeftOnscreenHelp".loc()
        }),
        targetDateField: SCUI.DatePickerView.design({
          layout: { top: 60, left: 250, width: 125, height: 24 },
          isEnabledBinding: SC.Binding.logicalAnd('CoreTasks.permissions.canUpdateProject', 'TasksProjectHelper.targetDateMode'),
          date: SC.DateTime.create()
        }),

        descriptionLabel: SC.LabelView.design({
          layout: { top: 70, left: 10, height: 17, width: 100 },
          icon: 'description-icon',
          value: "_Description:".loc()
        }),
        descriptionField: SC.TextFieldView.design({
          layout: { top: 95, left: 10, right: 10, bottom: 25 },
          hint: "_DescriptionHint".loc(),
          isTextArea: YES,
          isEnabledBinding: 'CoreTasks.permissions.canUpdateProject',
          value: that.getPath('content.description')
        }),
        
        createdAtLabel: SC.LabelView.design({
          layout: { left: 20, bottom: 5, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_LEFT,
          valueBinding: SC.binding('.content.displayCreatedAt', this)
        }),
        updatedAtLabel: SC.LabelView.design({
          layout: { right: 20, bottom: 5, height: 17, width: 250 },
          classNames: [ 'date-time'],
          textAlign: SC.ALIGN_RIGHT,
          valueBinding: SC.binding('.content.displayUpdatedAt', this)
        })
          
      })
    });
    if(this._editorPane) this._editorPane.popup(layer, SC.PICKER_POINTER);
  },
  
  inlineEditorWillBeginEditing: function(inlineEditor) {
    this._name = this.getPath('content.name');
    if(!CoreTasks.getPath('permissions.canUpdateProject')) {
      console.warn('You do not have permission to edit a project');
      inlineEditor.discardEditing();
    }
    else {
      if(this.get('isSystemProject')) {
        console.warn('You cannot edit a system project');
        inlineEditor.discardEditing();
      }
    }
  },
  
  inlineEditorDidEndEditing: function(inlineEditor, finalValue) {
    if(finalValue !== this._name && CoreTasks.getProject(finalValue)) {
      console.error('There is already a project with this name');
      this.set('isEditing', NO) ;
      this.displayDidChange();
    }
    else {
      sc_super();
      if(finalValue.indexOf('{') >= 0) { // if effort was specified inline, redraw got load balancing recalculation
        Tasks.assignmentsController.showAssignments();
      }
      if(CoreTasks.get('autoSave')) Tasks.saveData();
    }
  },
  
  render: function(context, firstTime) {
    
    var content = this.get('content');
    if(!content) return;
    // console.log('DEBUG: Project render(' + firstTime + '): ' + content.get('displayName'));
    sc_super();
    
    var isSystemProject = CoreTasks.isSystemProject(content);
    if(isSystemProject) context.addClass('system-project');
    
    // Put a dot before non-system projects that were created or updated recently
    if(!isSystemProject && content.get('isRecentlyUpdated')) {
      context = context.begin('div').addClass('recently-updated').attr({
        title: "_RecentlyUpdatedTooltip".loc(),
        alt: "_RecentlyUpdatedTooltip".loc()
      }).end();
    }

    var projectTooltip = '';
    if(content.get('id')) context.addClass('project-item');

    switch(content.get('developmentStatus')){
      case CoreTasks.STATUS_PLANNED:
        context.addClass('status-planned');
        break;
      case CoreTasks.STATUS_ACTIVE:
        context.addClass('status-active');
        break;
      case CoreTasks.STATUS_DONE:
        context.addClass('status-done');
        break;          
      case CoreTasks.STATUS_RISKY:
        context.addClass('status-risky');
        break;          
    }

    // Indicate which items have a description
    var description = SC.RenderContext.escapeHTML(content.get('description'));
    if(description) {
      description = description.replace(/\"/g, '\'');
      context = context.begin('div').addClass('description-icon')
                  .attr({'title': description,'alt': description}).end();
    }
    
  },

  renderIcon: function(context, icon){
    if(!SC.none(icon)) {
      var content = this.get('content');
      var projectTooltip = "_Has".loc() + content.getPath('tasks.length') + "_tasks".loc();
      context.begin('img').addClass('icon').addClass(icon).attr('src', SC.BLANK_IMAGE_URL)
        .attr('title', projectTooltip).attr('alt', projectTooltip).end();
    }
  },
  
  renderCount: function(context, count) {
    if(count) {
      // Show time left for project
      var timeLeftTooltip = "_ProjectTimeLeftTooltip".loc();
      context.push('<span class="count" title="' + timeLeftTooltip + '">');
      context.push('<span class="inner">').push(count).push('</span></span>');
    }
  }
  
});

Tasks.ProjectItemView.mixin(/** @scope Tasks.ProjectItemView */ {

  buildContextMenu: function() {
    
    var ret = [];
    // if(!content.get('id')) return ret; // group item
    
    // Ensure there are no system projects selected before creating context menu
    var sel = Tasks.projectsController.get('selection');
    var len = sel? sel.length() : 0;
    var context = {};
    for (var i = 0; i < len; i++) {
      var project = sel.nextObject(i, null, context);
      if (CoreTasks.isSystemProject(project)) return ret;
    }
    
    if(CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Add".loc(),
        icon: 'add-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'addProject'
      });
    }
    
    if(Tasks.projectsController.getPath('selection.length') === 1 &&
      CoreTasks.getPath('permissions.canCreateProject')) {
      ret.push({
        title: "_Duplicate".loc(),
        icon: 'duplicate-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'duplicateProject'
      });
    }

    if(CoreTasks.getPath('permissions.canDeleteProject')) {
      ret.push({
        title: "_Delete".loc(),
        icon: 'delete-icon',
        isEnabled: YES,
        target: 'Tasks',
        action: 'deleteProject'
      });
    }
    
    if(CoreTasks.getPath('permissions.canUpdateProject')) {

      ret.push({
        isSeparator: YES
      });

      var developmentStatus = Tasks.projectsController.get('developmentStatus');
      ret.push({
        title: '<span class=status-planned>' + CoreTasks.STATUS_PLANNED.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_PLANNED,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusPlanned'
      });
      ret.push({
        title: '<span class=status-active>' + CoreTasks.STATUS_ACTIVE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_ACTIVE,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusActive'
      });
      ret.push({
        title: '<span class=status-done>' + CoreTasks.STATUS_DONE.loc() + '</span>',
        icon: sc_static('blank'),
        isEnabled: YES,
        checkbox: developmentStatus === CoreTasks.STATUS_DONE,
        target: 'Tasks.projectsController',
        action: 'setDevelopmentStatusDone'
      });

    }
    
    return ret;
    
  }
  
});