
	function Todo( title, done ) {
			this.id = getUuid();
			this.title = title;
			this.done = done;
	}

	function getUuid() {
			var i, random,
				uuid = '';

			for ( i = 0; i < 32; i++ ) {
				random = Math.random() * 16 | 0;
				if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
					uuid += '-';
				}
				uuid += ( i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random) ).toString( 16 );
			}
			return uuid;
	}

	enyo.kind({
		name: "App",
		classes: "unselectable",
		components: [
			{content: "todos",classes: "title"},
			{classes: "app", components: [
				{classes: "todo-new", components: [
				    {kind:"enyo.Checkbox", classes: "toggle-all", name:"clearAll", onchange: "clearAll"},
					{kind: "enyo.Input", classes: "todo-new-input", name: "newTodo", placeholder: "What needs to be done?", onkeydown: "addOnEnter"}
				]},
				{kind: "Repeater", classes: "todo-list", name: "todoList", count: 0, onSetupItem: "setupItem", components: [
					{name: "item", classes: "item", components: [
						{kind:"enyo.Checkbox", classes: "item-checkbox", name:"isDone", onchange: "doneChange"},
						{kind:"enyo.Input", classes: "item-input", name: "input", onchange: "inputChange"},
						{classes: "item-delete",ontap: "deleteItem"}
					]}
				]},
				{name:"footer",classes:"footer", components: [
					{name:"todocount", classes: "todo-count", content:""},
					{name:"filters", content: "All Active Completed"},
					{name:"clearcompleted",classes:"clear-completed", tag:"button", content:"", ontap: "clearCompleted"}
				]},
			]},
		],
		create: function() {
			this.inherited(arguments);
			this.Todos = [];
			this.loadTodos();
		},
		loadTodos: function() {
			if ( !localStorage.getItem('todos-enyov') ) {
				localStorage.setItem( 'todos-enyov', JSON.stringify([]) );
			}
			this.Todos = JSON.parse( localStorage.getItem('todos-enyov') );
		},
		saveTodos: function() {
			localStorage.setItem( 'todos-enyov', JSON.stringify( this.Todos ) );
		},	
		clearAll: function(inSender, inEvent){
			var value = inSender.getValue();
			for ( i = 0, l = this.Todos.length; i < l; i++ ) {
				this.Todos[i].done=value;
			}
			this.saveTodos();
			this.$.todoList.setCount(this.Todos.length);
			this.refreshRemaining();
		},
		clearCompleted: function(inSender, inEvent) {
			var i = this.Todos.length;
			while ( i-- ) {
				if ( this.Todos[ i ].done ) {
					this.Todos.splice( i, 1 );
				}
			}
			this.saveTodos();
			this.$.todoList.setCount(this.Todos.length); // setCount refreshes the Repeater
			this.refreshRemaining();
		},
		rendered: function() {
			this.$.todoList.setCount(this.Todos.length);
			this.inherited(arguments);
			this.refreshRemaining();
		},
		setupItem: function(inSender, inEvent) {
			if (this.Todos[inEvent.index]) {
				var todo=this.Todos[inEvent.index];
				// update values
				inEvent.item.$.input.setValue(todo.title);
				inEvent.item.$.isDone.setValue(todo.done);
				// update classes
				inEvent.item.$.input.addRemoveClass("completed", this.Todos[inEvent.index].done);
				inEvent.item.$.isDone.addRemoveClass("checked", this.Todos[inEvent.index].done);
			}
			return true;
		},
		addOnEnter: function(inSender, inEvent) {
			if (inEvent.keyCode === 13) {
				this.addTodo(inSender.getValue().trim());
				inSender.setValue(""); // clear the input field
				return true;
			}
		},
		refreshRemaining: function() {
			if (this.Todos.length===0) {
				this.$.todoList.hide();
				this.$.footer.hide();
			} else {
				this.$.todoList.show();
				this.$.footer.show();

				var i,l;
				var remaining=0;
				var todoDone=0;

				var totalTodo = this.Todos.length;

				for ( i = 0, l = this.Todos.length; i < l; i++ ) {
					if ( this.Todos[ i ].done ) {
						todoDone++;
					}
				}

				var remaining= totalTodo - todoDone;
				var text = ' ' + ( remaining === 1 ? 'item' : 'items' ) + ' left';
				this.$.todocount.setContent(remaining+text);

				if (remaining === 0) {
					this.$.clearAll.setValue(true);
				} else {
					this.$.clearAll.setValue(false);
				}
				// hide or show&update clear completed button
				if (todoDone>0) {
					this.$.clearcompleted.setContent("Clear completed ("+todoDone+")");
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
			var todo = new Todo( value, false );
			this.Todos.push( todo );
			this.saveTodos();
			this.$.newTodo.hasNode().blur() // remove focus from input field
			this.$.todoList.setCount(this.Todos.length); // setCount refreshes the Repeater
			this.refreshRemaining();
		},
		inputChange: function(inSender, inEvent) {
			if(!inSender.getValue) {
				return;
			}
			this.Todos[inEvent.index].title=inSender.getValue();
			this.saveTodos();
			inEvent.originator.hasNode().blur() // remove focus from input field
		},
		doneChange: function(inSender, inEvent) {
			this.Todos[inEvent.index].done=!this.Todos[inEvent.index].done; // toggle state
			this.saveTodos();
			// re-render list item at index
			this.$.todoList.renderRow(inEvent.index);
			this.refreshRemaining();
		},
		deleteItem: function(inSender, inEvent) {
			this.Todos.splice( inEvent.index, 1 );
			this.saveTodos();
			this.$.todoList.setCount(this.Todos.length); // setCount refreshes the Repeater
			this.refreshRemaining();
		}
	});