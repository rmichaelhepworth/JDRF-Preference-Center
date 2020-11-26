%%[
	var @messageContext,@contactKey,@firstName,@lastName
	var @monthlyNewsletter,@AdvocacyNewsletter,@researchNewsletter,@chapterUpdates
  var @settingsObject,@publicationLists,@contactFields,@referrer,@agent,@action
  Set @publicationLists = LookupOrderedRows("Publication Lists",-1,"Order","Active",1);
	Set @messageContext = [_messagecontext]
  Set @agent = HTTPRequestHeader('User-Agent')
  Set @referrer = HTTPRequestHeader('Referer')
  Set @host = HTTPRequestHeader('Host')
  Set @contactFields = 'Id, FirstName,LastName'
  FOR @publicationListIndex = 1 TO RowCount(@publicationLists) DO
    Set @ContactFields = Concat(Iif(Empty(@ContactFields),"",Concat(@ContactFields,",")),Field(Row(@publicationLists,@publicationListIndex),"CRM_Field_Name"))
  NEXT @publicationListIndex
]%%
<script runat=server>
	Platform.Load("Core","1");
  var responseObject = {};
	try
	{
		Variable.SetValue("@contactKey",Platform.Request.GetQueryStringParameter('contactKey'));
		Variable.SetValue("@action",Platform.Request.GetQueryStringParameter('action'));
</script>
%%[
	Set @settingsObject = "[";
	IF (@action == 'update') THEN
	  var @updateRecord
	  set @updateRecord = UpdateSingleSalesforceObject(
	  "Contact", @contactKey,
	  "Mkto_Research_News__c",Iif(IsNull(RequestParameter("Mkto_Research_News__c")),"false","true")
	  )
	ENDIF
	Set @rs= RetrieveSalesforceObjects('Contact', @contactFields, 'Id', '=', @contactKey);
	IF RowCount(@rs) > 0 THEN
	  FOR @publicationListIndex = 1 TO RowCount(@publicationLists) DO
	    Set @publicationListTitle = Field(Row(@publicationLists,@publicationListIndex),"Title")
	    Set @publicationListCRMFieldName = Field(Row(@publicationLists,@publicationListIndex),"CRM_Field_Name")
	    Set @publicationListValue = Field(Row(@rs,1),@publicationListCRMFieldName)
	    //Add object to array
	    Set @settingsObject = Concat(@settingsObject,"{""Title"":""",@publicationListTitle,""",""CRMFieldName"":""",@publicationListCRMFieldName,""",""Value"":""",@publicationListValue,"""}",Iif(@publicationListIndex == RowCount(@publicationLists),"",","))
		NEXT @publicationListIndex

	  Set @firstName = Field(Row(@rs,1),'FirstName');
	  Set @lastName = Field(Row(@rs,1),'LastName');
	ENDIF
	Set @settingsObject = Concat(@settingsObject,"]");
]%%
<script runat=server>
    responseObject.contactKey = Variable.GetValue("@contactKey");
    responseObject.firstName = Variable.GetValue("@firstName");
    responseObject.lastName = Variable.GetValue("@lastName");
    eval("responseObject.publicationListSettings = " + Variable.GetValue("@settingsObject"));
	}
	catch(e)
	{
		responseObject.error = e.message;
	}
  finally
  {
		var responseString = Stringify(responseObject);
    Platform.Response.SetResponseHeader("Content-Type","application/json");
    Platform.Response.Write(responseString);
  }
</script>
