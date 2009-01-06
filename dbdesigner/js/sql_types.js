/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2009 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/* -------------------------- generic data types -------------------------- */

var SQL_DATA_TYPES = [
	{color:"rgb(238,238,170)",name:"Numeric",types:[]},
	{color:"rgb(255,200,200)",name:"Character",types:[]},
	{color:"rgb(200,255,200)",name:"Date & Time",types:[]}
];

var SQL_DATA_TYPES_DEFAULT = [
	{name:"Integer",type:0,params:"",prefix:"",suffix:"",def:0},
	{name:"Small Integer",type:1,params:"",prefix:"",suffix:"",def:0},
	{name:"Single Precision",type:2,params:"",prefix:"",suffix:"",def:0},
	{name:"Double precision",type:3,params:"",prefix:"",suffix:"",def:0},
	{name:"String",type:4,params:"length",prefix:"'",suffix:"'",def:"''"},
	{name:"Text",type:5,params:"",prefix:"'",suffix:"'",def:"''"},
	{name:"Binary",type:6,params:"length",prefix:"0x",suffix:"",def:""},
	{name:"Large binary",type:7,params:"",prefix:"0x",suffix:"",def:""},
	{name:"Date",type:8,params:"",prefix:"",suffix:"",def:""},
	{name:"Time",type:9,params:"",prefix:"",suffix:"",def:""},
	{name:"Datetime",type:10,params:"",prefix:"",suffix:"",def:""},
	{name:"Timestamp",type:11,params:"",prefix:"",suffix:"",def:""}
];
