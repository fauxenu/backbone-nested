require.config({
	shim: {
		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'underscore': {
			exports: '_'
		}
	},
	paths: {
		jquery: 'lib/jquery',
		backbone: 'lib/Backbone',
		underscore: 'lib/underscore',
		nested: '../backbone-nested'
	}
});

require(['jquery', 'backbone', 'nested'], function($, Backbone){
	// Sets dummy JSON response
	var response = {
		"title": "New Title Value",
		"children": [
			{"title": "Child 1", "value": 10, "id": "cm_1", "cid": "c2"},
			{"title": "Child 2", "value": 20, "id": "cm_2"},
			{"title": "Child 3", "value": 30, "id": "cm_3"},
			{"title": "Child 4", "value": 40, "id": "cm_4"},
			{"title": "Child 5", "value": 50, "id": "cm_5"}
		]
	};

	// Sets up nested models
	var Child = Backbone.NestedModel.extend({
		defaults: {
			title: 'Child Model',
			value: 0
		}
	});

	var ChildList = Backbone.Collection.extend({
		model: Child
	});

	var Parent = Backbone.NestedModel.extend({
		defaults: {
			title: 'Many Relation Model'
		},
		relations: [{
			type: Backbone.Many,
			key: 'children',
			relatedModel: Child,
			collectionType: ChildList
		}]
	});

	var ParentSingle = Backbone.NestedModel.extend({
		defaults: {
			title: 'Single Relation Model'
		},
		relations: [{
			type: Backbone.One,
			key: 'child',
			relatedModel: Child
		}]
	});

	// Creates models
	var parent = new Parent({
		title: 'New Parent Model',
		children: [
			{title: 'Child 1', value: 1},
			{title: 'Child 2', value: 2},
			{title: 'Child 3', value: 3},
			{title: 'Child 4', value: 4},
			{title: 'Child 5', value: 5}
		]
	});

	var sParent = new ParentSingle({
		title: 'New Single Relation',
		child: {
			title: 'Single Relation Child',
			value: 10
		}
	});
	
	console.log(parent)
	console.log(sParent.toJSON());
});