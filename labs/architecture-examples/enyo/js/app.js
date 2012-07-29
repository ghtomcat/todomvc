	// Todo
  	var Todo = Backbone.Model.extend({
  
    toggle: function() {
      this.save({done: !this.get("done")});
    },

    // Remove this Todo from *localStorage*, deleting its view.
    clear: function() {
      this.destroy();
    }
  
  });

  // Todo List
  var TodoList = Backbone.Collection.extend({
  
    model: Todo,
    localStorage: new Store("todos-enyo"),
  
    // Returns all done todos.
    done: function() {
      return this.filter(function(todo){
        return todo.get('done');
      });
    },

    // Filter down the list to only todo items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    comparator: function(todo) {
      return todo.get('order');
    },

    pluralize: function(count) {
      return count == 1 ? 'item' : 'items';
    }
  
  });

  var Todos = new TodoList;

	enyo.kind({
		name: "App",
		classes: "app unselectable",
		components: [
			{kind: "FittableRows", components: [
				{kind: "onyx.Toolbar", classes: "title", components: [
					{content: "Todos"}
				]},
				{classes: "todo-new", components: [
				    {kind:"onyx.Checkbox", classes: "toggle-all", name:"clearAll", onchange: "clearAll"},
					{kind: "onyx.Input", classes: "todo-new-input", name: "newTodo", placeholder: "What needs to be done?", onkeydown: "addOnEnter"}
				]},
					{kind: "Repeater", classes: "todo-list", name: "todoList", count: 0, onSetupItem: "setupItem", components: [
						{name: "item", classes: "item", components: [
							{kind:"onyx.Checkbox", classes: "item-checkbox", name:"isDone", onchange: "doneChange"},
							{kind:"onyx.Input", classes: "item-input", name: "input", onchange: "inputChange"},
							{kind: "onyx.IconButton", classes: "item-delete", src: "assets/toolbar-icon-delete.png", ontap: "deleteItem"}
						]}
					]},
			]},
			{name:"footer",classes:"footer", components: [
				{name:"todocount", classes: "todo-count", content:""},
				{name:"filters", content: "All Active Completed"},
				{name:"clearcompleted",classes:"clear-completed", tag:"button", content:"", ontap: "clearCompleted"}
			]}
		],

		clearAll: function(inSender, inEvent){
			var value = inSender.getValue();
			var x = this.$.todoList;
			var z = x.getComponents();
			for(var i =0;i < z.length; i++){
				z[i].$.isDone.setValue(value)
				this.setTextStyle(z[i].$.input, value);
				Todos.at(i).save({"done": value});
			}
			this.refreshRemaining();
		},
		clearCompleted: function(inSender, inEvent) {
			_.each(Todos.done(), function(todo) { todo.destroy(); } );
			this.$.todoList.setCount(Todos.length); // setCount refreshes the Repeater
			this.refreshRemaining();
		},
		setTextStyle: function(input, value){
			if(value) {
				input.addClass("completed");
			} else {
				input.removeClass("completed");
			}
		},

		rendered: function() {
			Todos.fetch();
			this.$.todoList.setCount(Todos.length);
			this.inherited(arguments);
			this.refreshRemaining();
		},
		setupItem: function(inSender, inEvent) {
			if (Todos.at(inEvent.index)) {
				inEvent.item.$.input.setValue(Todos.at(inEvent.index).get("content")); // get value from model and update repeater item
				inEvent.item.$.isDone.setValue(Todos.at(inEvent.index).get("done")); // get value from model and update repeater item
				this.setTextStyle(inEvent.item.$.input, Todos.at(inEvent.index).get("done"));
			}
		},
		addOnEnter: function(inSender, inEvent) {
			if (inEvent.keyCode === 13) {
				this.addTodo(inSender.getValue().trim());
				inSender.setValue(""); // clear the input field
				return true;
			}
		},
		refreshRemaining: function() {
			if (Todos.length===0) {
				this.$.todoList.hide();
				this.$.footer.hide();
			} else {
				this.$.todoList.show();
				this.$.footer.show();

				var remaining=Todos.remaining().length; // example how to call collection functions
				var count=Todos.pluralize(remaining);
				this.$.todocount.setContent(remaining+" "+count+" left");

				if (remaining === 0) {
					this.$.clearAll.setValue(true);
				} else {
					this.$.clearAll.setValue(false);
				}
				// hide or show&update clear completed button
				var done=Todos.done().length;
				if (done>0) {
					this.$.clearcompleted.setContent("Clear completed ("+done+")");
					this.$.clearcompleted.show();
				} else {
					this.$.clearcompleted.hide();
				}
			}
		},
		addTodo: function(value) {
			if(!value) {
				return; // empty string
			}
			Todos.create({ // create new model and add to collection
				content: value,
				done:    false
			});
			this.$.todoList.setCount(Todos.length); // setCount refreshes the Repeater
			this.$.newTodo.hasNode().blur() // remove focus from input field
			this.refreshRemaining();
		},
		inputChange: function(inSender, inEvent) {
			Todos.at(inEvent.index).save({"content": inSender.getValue()}); // update the content attribute in the model at index
			inEvent.originator.hasNode().blur() // remove focus from input field
		},
		doneChange: function(inSender, inEvent) {
			Todos.at(inEvent.index).save({"done": !Todos.at(inEvent.index).get("done")}); // toggle the done attribute in the model at index
			this.setTextStyle(inEvent.originator.container.children[1], Todos.at(inEvent.index).get("done"));
			this.refreshRemaining();
		},
		deleteItem: function(inSender, inEvent) {
			var model = Todos.at(inEvent.index);
			model.destroy();
			Todos.remove(model);
			this.$.todoList.setCount(Todos.length); // setCount refreshes the Repeater
			this.refreshRemaining();
		}
	});