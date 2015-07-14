/**
* Meadow Endpoint - Create a Record
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
/**
* Create a record using the Meadow DAL object
*/
var doAPICreateEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Create;
	
	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	if (typeof(pRequest.body) !== 'object')
	{
		return pRequest.CommonServices.sendError('Record create failure - a valid record is required.', pRequest, pResponse, fNext);
	}
	var tmpNewRecord = pRequest.body;

	// INJECT: Record modification before insert

	var tmpQuery = pRequest.DAL.query;

	// INJECT: Query configuration and population
	tmpQuery.addRecord(tmpNewRecord);
	
	// Do the create operation
	pRequest.DAL.setIDUser(pRequest.SessionData.UserID).doCreate(tmpQuery,
		function(pError, pQuery, pReadQuery, pRecord)
		{
			if (!pRecord)
			{
				return pRequest.CommonServices.sendError('Error creating a record.', pRequest, pResponse, fNext);
			}

			// INJECT: Post insert record modifications

			pRequest.CommonServices.log.info('Created a record with ID '+pRecord[pRequest.DAL.defaultIdentifier]+'.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Create'});
			pResponse.send(pRecord);
			return fNext();
		});
};

module.exports = doAPICreateEndpoint;