/**
 * A simple library for handling nested backbone models,
 * inspired by backbone-associations
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

            constructor: function(attributes, options){
                Proto.constructor.apply(this, arguments);

                // Overrides auto-assigned cid value if one is present in the
                // attributes hash; needed for correct model sync behaviour 
                if(this.attributes.cid)
                    this.cid = this.attributes.cid
            },

    		/**
    		 * Overrides default set function to allow for proper
    		 * nested model/collection setup
    		 *
    		 * @param {String} key model attribute key to set
    		 * @param {Object} value the value to set
    		 * @param {Object} [options] additional set options
    		 */
    		set: function(key, value, options) {
                var keys, relations = [], attributes = {};

                // Duplicates backbone support for setting mulitple attributes
                // as key-value pairs
                if(_.isObject(key) || key == null) {
                    keys = key;
                    options = value;
                }
                else {
                    keys = {};
                    keys[key] = value;
                }

                if(keys) {
                    // Separates nested relations from regular model attributes
                    for(attr in keys) {
                        var rel = _.findWhere(this.relations, {'key': attr});
                        
                        if(rel)
                            relations.push({relation: rel, value: keys[attr]});
                        else
                            attributes[attr] = keys[attr];
                    }

                    // Sets nested model/collection attributes
                    if(relations.length)
                        this._setNested(relations, _.isEmpty(attributes), options);

                    // Sets regular model attributes
                    if(!_.isEmpty(attributes))
                        Proto.set.call(this, attributes, options);
                }

                return this;
    		},

    		/**
    		 * Sets attribute that is defined as a nested relation
    		 *
    		 * @param {Array} relations an array of nested relations to update
             * @param {Boolean} triggerChange triggers a generic change event when true
    		 * @param {Object} [options] additional set options
    		 */
    		_setNested: function(relations, triggerChange, options) {
                options = (options) ? options : {test: true};

                for(var x = 0; x < relations.length; x++) {
                    var relation = relations[x].relation,
                        value = relations[x].value,
                        changed = false;

                    if(!relation.relatedModel || !(relation.relatedModel.prototype instanceof Backbone.Model))
                        throw('Invalid relatedModel! Must inherit from Backbone.Model.');

                    // Updates relations
                    if(relation.type == Backbone.Many)
                        changed = this._setManyToOne(relation, value, options);
                    else 
                        changed = this._setOneToOne(relation, value, options);

                    if(!options.silent && changed) {
                        this.trigger(
                            'change:' + relation.key, 
                            this, 
                            this.get(relation.key), 
                            options
                        );
                    }
                }

                if(!options.silent && triggerChange)
                    this.trigger('change', this, options);
    		},

            /**
             * Creates/updates a many-to-one nested model relation
             *
             * @param {Object} relation nested relation hash
             * @param {Object} value relation value to set
             * @param {Object} [options] additional set options
             * @return {Boolean} true if the nested collection was updated
             */
            _setManyToOne: function(relation, value, options) {
                if(relation.collectionType && !(relation.collectionType.prototype instanceof Backbone.Collection))
                    throw('Invalid collectionType! Must inherit from Backbone.Collection.');

                // Gets collection to store relations in
                var collection = this._getOrCreateCollection(
                    relation.key, 
                    relation.collectionType, 
                    relation.relatedModel
                );

                if(_.isArray(value) || value instanceof Backbone.Collection) {
                    collection.set(value, options);
                    return true;
                }
                else if(!_.isEmpty(value)) {
                    collection.set([value], _.extend(options, {remove: false}));
                    return true;
                }
                else
                    return false;
            },

            /**
             * Creates/updates a one-to-one nested model relation
             *
             * @param {Object} relation nested relation hash
             * @param {Object} value relation value to set
             * @param {Object} [options] additional set options
             * @return {Boolean} true if the nested model was created/updated
             */
            _setOneToOne: function(relation, value, options) {
                var model = this.get(relation.key),
                    field = null,
                    result = true;

                if(!_.isEmpty(value) && model && model instanceof Backbone.Model)
                    field = !model.isNew() ? 'id' : 'cid';

                if(field && value[field] && value[field] == model[field]) {
                    // Updates existing model
                    var attrs = (value instanceof Backbone.Model) ? value.attributes : value;
                    model.set(attrs, options);
                    
                    if(_.isEqual(model.attributes, attrs))
                		result = false;
                }
                else {
                    // Creates new model
                    Proto.set.call(
                        this, 
                        relation.key,
                        this._prepareNestedModel(value, relation.relatedModel),
                        options
                    );
                }

                return result;
            },

            /**
             * Gets or creates Backbone collection to use for many-to-one relations
             * 
             * @param {String} key
             * @param {Object} type
             * @param {Object} modelType
             * @return {Backbone.Collection}
             */
            _getOrCreateCollection: function(key, type, modelType) {
                // Creates new collection is one isn't set or it is of the wrong data
                if(!this.has(key) || !(this.get(key) instanceof Backbone.Collection)) {
                    if(type) 
                        Proto.set.call(this, key, new type());
                    else {
                        // Creates a generic collection if no type is given
                        var collection = new Backbone.Collection();
                        collection.model = modelType;
                        Proto.set.call(this, key, model);
                    }
                }

                return this.get(key);
            },

            /**
             * Prepares new nested model
             *
             * @param {Object} obj an attributes hash or a backbone model
             * @param {Object} modelType model to insstantiate attributes hash as
             */
            _prepareNestedModel: function(obj, modelType){
                if(obj instanceof Backbone.Model)
                    return obj;
                else if(!_.isEmpty(obj))
                    return new modelType(obj);
                else
                    return null;
            },

    		/**
    		 * Creates json-serializable representation of this model
             *
    		 * @return {Object} json object
    		 */
    		toJSON: function(options) {
                var json = Proto.toJSON.apply(this, arguments);

                if(this instanceof Backbone.Model)
                    json.cid = this.cid;

                // Creates json representation for nested relations
                if(this.relations) {
                    for(rel in this.relations) {
                        var key = this.relations[rel].key,
                            attr = this.attributes[key],
                            nested = null;

                        if(attr) {
                            nested = attr.toJSON();
                            json[key] = _.isArray(nested) ? _.compact(nested) : nested;
                        }
                    }
                }

                return json;
    		},

    		/**
    		 * Creates a new model with identical attributes
             *
    		 * @return {Backbone.NestedModel}
    		 */
    		clone: function() {
    			return new this.constructor(this.toJSON());
    		}
    	});

	})(Backbone, _, $ || window.jQuery || window.Zepto);
}));