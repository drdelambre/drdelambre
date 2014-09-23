// $dd.db_model
//     playing with nosql nicely
;(function(factory){
	if(typeof define === 'function' && define.amd){
		define(['../dd','./model','../polyfill/keys'], factory);
	} else if(typeof exports === 'object'){
		module.exports = factory(require('../dd'),require('./model'));
	} else {
		factory($dd);
	}
})(function(lib){
	lib.mixin({
		db_model: function(def){
			var self = lib.model(def).on_fill(function(_data){
				if(_data.hasOwnProperty('_id')){
					self.id = _data._id;
				}
				if(_data.hasOwnProperty('collection')){
					self.collection = _data.collection;
					delete _data.collection;
				}
			});

			self._save = [];

			self.on_save = function(filter,fire_before){
				if(!lib.type(filter,'function')){
					return;
				}
				self._save.push({
					before: fire_before,
					fun: filter
				});
			};

			self.save = function(){
				var ni;
				if(!self.collection){
					throw new Error('$dd.db_model: no collection set for save');
				}

				for(ni = 0; ni < self._save.length; ni++){
					if(!self._save[ni].before){
						continue;
					}
					if(self._save[ni].fun(self) === false){
						return;
					}
				}

				if(!self.id){
					self.collection.insert(self.out(),function(err,d){
						if(err){
							console.log("Error inserting record",self.out());
							return;
						}
						self.id = d._id;
					});
				} else {
					self.collection.update({ _id: self.id },self.out());
				}

				for(ni = 0; ni < self._save.length; ni++){
					if(self._save[ni].before){
						continue;
					}
					self._save[ni].fun(self)
				}
			};

			self.find = function(filters,callback){
				if(!self.collection){
					throw new Error('$dd.db_model: no collection set for find');
				}

				if(!lib.type(callback,'function')){
					return;
				}

				self.collection.find(filters,function(err,items){
					if(err){
						console.log("Error Searching! ",filters,err);
						callback([]);
						return;
					}
					if(items === null){
						callback([]);
						return;
					}

					//convert results to records
					var r = [],
						ne;
					for(ne = 0; ne < items.length; ne++){
						r.push(self(items[ne]));
					}

					callback(r);
				});
			};

			self.findOne = function(filters,callback){
				if(!self.collection){
					throw new Error('$dd.db_model: no collection set for find');
				}

				if(!lib.type(callback,'function')){
					return;
				}

				self.collection.findOne(filters,function(err,item){
					if(err){
						console.log("Error Searching! ",filters,err);
						callback(null);
						return;
					}
					if(item === null){
						callback(null);
						return;
					}

					callback(self(item));
				});
			};

			return self;
		}
	});
});