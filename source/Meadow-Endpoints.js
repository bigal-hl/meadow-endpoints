/**
* Meadow Data Broker Library
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/

/**
* Meadow Data Broker Library
*
* @class MeadowEndpoints
* @constructor
*/
var libAsync = require('async');

var MeadowEndpoints = function()
{
	function createNew(pMeadow)
	{
		// If a valid Fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || (!pMeadow.hasOwnProperty('fable')))
		{
			return {new: createNew};
		}
		var _Meadow = pMeadow;
		var _Fable = pMeadow.fable;

		var _CommonServices = require('./Meadow-CommonServices.js').new(pMeadow);

		// This checks that the user is authenticated.  In the future, it will be overloadable.
		var _Authenticator = require('./Meadow-Authenticator.js');


		// The default endpoints
		var _Endpoints = (
		{
			Create: require('./crud/Meadow-Endpoint-Create.js'),
			Read: require('./crud/Meadow-Endpoint-Read.js'),
			Reads: require('./crud/Meadow-Endpoint-Reads.js'),
			Update: require('./crud/Meadow-Endpoint-Update.js'),
			Delete: require('./crud/Meadow-Endpoint-Delete.js'),
			Count: require('./crud/Meadow-Endpoint-Count.js')
		});

		/**
		* Customize a default endpoint (or create more)
		*
		* @method setEndpoint
		*/
		var setEndpoint = function(pEndpointHash, fEndpoint)
		{
			if (typeof(fEndpoint) === 'function')
			{
				_Endpoints[pEndpointHash] = fEndpoint;
			}

			return this;
		};


		// The default authenticators
		var _EndpointAuthenticators = (
		{
			Create: _Authenticator,
			Read: _Authenticator,
			Reads: _Authenticator,
			Update: _Authenticator,
			Delete: _Authenticator,
			Count: _Authenticator
		});

		/**
		* Customize an endpoint Authenticator
		*
		* @method setEndpointAuthenticator
		*/
		var setEndpointAuthenticator = function(pEndpointHash, fAuthenticator)
		{
			if (typeof(fAuthenticator) === 'function')
			{
				_EndpointAuthenticators[pEndpointHash] = fAuthenticator;
			}

			return this;
		};


		// The default endpoint authorization levels
		var _EndpointAuthorizationLevels = (
		{
			Create: 1,
			Read: 1,
			Reads: 1,
			Update: 1,
			Delete: 1,
			Count: 1
		});

		/**
		* Customize an endpoint Authorization Level
		*
		* @method setEndpointAuthorization
		*/
		var setEndpointAuthorization = function(pEndpointHash, pAuthorizationLevel)
		{
			_EndpointAuthorizationLevels[pEndpointHash] = pAuthorizationLevel;
			return true;
		};


		/**
		* Add the common services object to the request early in the route chain
		*/
		var wireCommonServices = function (pRequest, pResponse, fNext)
		{
			// TODO: There is a shared state issue with using this as the source for the authorization levels.  Fix it.
			pRequest.CommonServices = _CommonServices;
			fNext();
		};


		/**
		* Add the explicit state to the request that is coming through this endpoint
		*/
		var wireState = function (pRequest, pResponse, fNext)
		{
			// TODO: There is a shared state issue with using this as the source for the authorization levels.  Fix it.
			pRequest.EndpointAuthorizationLevels = _EndpointAuthorizationLevels;
			pRequest.DAL = _Meadow;
			fNext();
		};


		/**
		* Wire up routes for the API
		*
		* @method connectRoutes
		* @param {Object} pRestServer The Restify server object to add routes to
		*/
		var connectRoutes = function(pRestServer)
		{
			// TODO: Pull version from the config file.
			var tmpEndpointVersion = '1.0';
			// TODO: Allow the user to override the endpoint "name" eventually.
			var tmpEndpointName = _Meadow.scope;

			_Fable.log.trace('Creating endpoint', {Version:tmpEndpointVersion, Name:tmpEndpointName});

			// Connect the common services to the route
			pRestServer.use(wireCommonServices);

			pRestServer.post('/1.0/'+tmpEndpointName, _EndpointAuthenticators.Create, wireState, _Endpoints.Create);
			pRestServer.get('/1.0/'+tmpEndpointName+'/:IDRecord', _EndpointAuthenticators.Read, wireState, _Endpoints.Read);
			pRestServer.get('/1.0/'+tmpEndpointName+'s', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/:Begin/:Cap', _EndpointAuthenticators.Reads, wireState, _Endpoints.Reads);
			pRestServer.put('/1.0/'+tmpEndpointName, _EndpointAuthenticators.Update, wireState, _Endpoints.Update);
			pRestServer.del('/1.0/'+tmpEndpointName, _EndpointAuthenticators.Delete, wireState, _Endpoints.Delete);
			pRestServer.get('/1.0/'+tmpEndpointName+'s/Count', _EndpointAuthenticators.Count, wireState, _Endpoints.Count);
		};


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowEndpointObject = (
		{
			setEndpoint: setEndpoint,
			setEndpointAuthenticator: setEndpointAuthenticator,
			setEndpointAuthorization: setEndpointAuthorization,

			wireState: wireState,

			connectRoutes: connectRoutes,

			// Factory
			new: createNew
		});

		/**
		 * Endpoint Authorization Levels
		 *
		 * @property endpointAuthorizationLevels
		 * @type object
		 */
		Object.defineProperty(tmpNewMeadowEndpointObject, 'endpointAuthorizationLevels',
			{
				get: function() { return _EndpointAuthorizationLevels; },
				enumerable: true
			});

		return tmpNewMeadowEndpointObject;
	}

	return createNew();
};

module.exports = new MeadowEndpoints();
