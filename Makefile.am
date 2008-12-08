#
#  This file is part of the OpenLink Ajax Toolkit (OAT) project
#
#  Copyright (C) 2005-2008 OpenLink Software
#
#  This project is free software; you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by the
#  Free Software Foundation; only version 2 of the License, dated June 1991
#
#  This project is distributed in the hope that it will be useful, but
#  WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
#  General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software Foundation,
#  Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
#

AUTOMAKE_OPTIONS	= gnu 1.7 dist-zip

SUBDIRS = \
	demo \
	dbdesigner \
	exhibit-sparql \
	formdesigner \
	fresnel \
	images \
	interopfest \
	iphone_data_page \
	isparql \
	linked_data_page \
	notify \
	oat \
	qbe \
	rdfbrowser \
	rdfbrowser2 \
	styles \
 	xslt

DISTCLEANFILES = autogen.log

EXTRA_DIST = \
	LICENSE \
	CREDITS \
	DOAP-OAT.rdf \
	autogen.sh


# ----------------------------------------------------------------------
#
#  Maintainers only
#
# ----------------------------------------------------------------------

if MAINTAINER_MODE

#
#  Create a source snapshot package
#
snapshot:
	$(MAKE) dist distdir=$(PACKAGE)-`date +"%Y%m%d"`



#
#  Generate ChangeLog
#
changelog:
	cvs2cl --no-wrap --hide-filenames --utc --prune --window 3600

endif
