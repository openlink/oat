<?xml version="1.0" encoding="UTF-8" ?>
<!--

  $Id$

  This file is part of the OpenLink Ajax Toolkit (OAT) project

  Copyright (C) 2005-2020 OpenLink Software

  This project is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the
  Free Software Foundation; only version 2 of the License, dated June 1991

  This project is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software Foundation,
  Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

-->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/*">
		<html>
		<body id="body">
		<xsl:for-each select="//table">
			<xsl:text>CREATE TABLE `</xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text>` (
</xsl:text>
			<xsl:for-each select="column">
				<xsl:text>`</xsl:text>
				<xsl:value-of select="@name" />
				<xsl:text>` </xsl:text>
				<xsl:value-of select="@type" />
				<xsl:text> </xsl:text>

				<xsl:if test="@notnull='Y'">
					<xsl:text>NOT NULL </xsl:text>
				</xsl:if> 

				<xsl:choose>
					<xsl:when test="@primarykey='Y'">
						<xsl:text>PRIMARY KEY AUTO_INCREMENT </xsl:text>
					</xsl:when>
					<xsl:otherwise>
						<xsl:if test="default/value!=''">
							<xsl:text>default '</xsl:text>
							<xsl:value-of select="default/value" />
							<xsl:text>'</xsl:text>
						</xsl:if>
					</xsl:otherwise>
				</xsl:choose>
				
				<xsl:if test="@foreignkey!=''">
					<xsl:text> REFERENCES </xsl:text>
					<xsl:value-of select="@foreignkey" />
				</xsl:if> 
				
				<xsl:if test="index">
					<xsl:text>,
</xsl:text>
					<xsl:text>INDEX (</xsl:text>
					<xsl:value-of select="@name" />
					<xsl:text>)</xsl:text>
				
				</xsl:if>

				<xsl:if test="not (position()=last())">
					<xsl:text>,
</xsl:text>
				</xsl:if> 
			</xsl:for-each>
			<xsl:text>
);

</xsl:text>
		</xsl:for-each>
		</body>
		</html>
	</xsl:template>

</xsl:stylesheet>
