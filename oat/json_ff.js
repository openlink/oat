/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2018 OpenLink Software
 *
 *  See LICENSE file for details.
 *
 */

// special version create for usign with FF extensions only, 
// for avoid problem with FF extension verification process

OAT.JSON = {

	deserialize:function(jsonString) {
               	return JSON.parse(jsonString);
	},
			
	serialize:function(something, c) {
       		return JSON.stringify(something);
	}

}

//  Backward compatibility
OAT.JSON.stringify = OAT.JSON.serialize;
OAT.JSON.parse     = OAT.JSON.deserialize;
