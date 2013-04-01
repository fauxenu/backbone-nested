/**
 * A simple library for handling nested backbone models
 * 
 * @author Bryan Hilmer
 * @version 0.1.0
 */
(function (root, factory) {
	if(typeof exports === 'object') {
		var jquery = require('jquery'),
			underscore = require('underscore'),
			backbone = require('backbone');

		module.exports = factory(jquery, underscore, backbone);
	}
	else if(typeof define === 'function' && define.amd) {
		define(['jquery', 'underscore', 'backbone'], factory);
	}
}(this, function($, _, Backbone) {
	(function(Backbone, _, $){
		var NestedModel, Proto;

		Proto = Backbone.Model.prototype;

		// Defines supported nested relations
    	Backbone.Many = "Many";
    	Backbone.One = "One";

    	NestedModel = Backbone.NestedModel = Backbone.Model.extend({
    		relations: undefined,

    		/**
    		 * Overrides default set function to allow for proper
    		 * nested model/collection setup
    		 *
    		 * @param {String} key model attribute key to set
    		 * @param {Object} value the value to set
    		 * @param {Object} [options] additional set options
    		 */
    		set: function(key, value, options) {
    			var relation = _.findWhere(this.relations, {'key': key});

    			if(relation)
    				this._setNested(relation, value, options);
    			else
    				Proto.set.apply(this, arguments);
    		}

    		/**
    		 * Sets attribute that is defined as a nested relation
    		 *
    		 * @param {Object} relation
    		 * @param {Object} value
    		 * @param {Object} [options]
    		 */
    		_setNested: function(relation, value, options) {
                if(!relation.relatedModel || !(relation.relatedModel.prototype instanceof Backbone.Model))
                    throw('Invalid relatedModel! Must inherit from Backbone.Model.');

                if(relation.type == Backbone.Many) {
                    if(relation.collectionType && !(relation.collectionType.prototype instanceof Backbone.Collection))
                        throw('Invalid collectionType! Must inherit from Backbone.Collection.');

                    var collection = _getOrCreateCollection(
                        relation.key, 
                        relation.collectionType, 
                        relation.relatedModel
                    );

                    if(_.isArray(value) || value instanceof Backbone.Collection)
                        collection.set(value, options);
                    else
                        collection.add(value, options);
    			}
    			else {
    				
    			}
    		},

            /**
             * Gets or creates Backbone collection to use for many-to-one relations
             * @param {String} key
             * @param {Object} type
             * @param {Object} modelType
             */
            _getOrCreateCollection: function(key, type, modelType) {
                 // Creates new collection is one isn't set or it is of the wrong data
                if(!this.has(key) || !(this.get(key) instanceof Backbone.Collection)) {
                    if(type) 
                        this.set(key, new type());
                    else {
                        // Creates a generic collection if no type is given
                        var collection = new Backbone.Collection();
                        collection.model = modelType;
                        this.set(key, model);
                    }
                }

                return this.get(key);
            },

    		/**
    		 * Creates json-serializable representation of this model
    		 * @return {Object}
    		 */
    		toJSON: function() {

    		},

    		/**
    		 * Creates a new model with identical attributes
    		 * @return {Backbone.NestedModel}
    		 */
    		clone: function() {
    			return new this.constructor(this.toJSON());
    		}
    	});

	})(Backbone, _, $ || window.jQuery || window.Zepto);
}));