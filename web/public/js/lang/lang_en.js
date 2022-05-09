/*
 * README
 * each key must correspond to class value
 * example :
 * 	objectLanguage.version for the key 'version', it has to be the same value's class in <span class="lang-version" />
 *  objectLanguage.test for the key 'test', it has to be the same value's class in <span class="lang-test" />
 *
 */
var objectLanguage = {
	version : "English",

	/*
	 * header.jade
	 */
	dashboard : "Dashboard",
	workspace : "Workspace",
	browse : "Browse",
	maintenance : "Maintenance",
	advanced : "Advanced",
	inboundtrigger : "Inbound Trigger",
	logviewer : "Log Viewer",
	recompute : "Recompute",
	clean : "Clean",
	changeownership : "Change Ownership",
	sendemail : "Send Email",
	audits : "Audits",
	environmentreport : "Environment Report",
	console : "Console",
	startstop : "Start / Stop",
	environmentvariables : "Environment Variables",
	versions : "Versions",
	configuration : "Configuration",
	manageaccounts : "Manage Accounts",
	about : "About",

	/*
	 * dashboard.jade
	 */
	sessionmanager : "Session Manager",
	servers : "Servers",
	operatingsystem : "Operating System",
	networkinterfacecards : "Network Interface Cards",
	swapspace : "Swap space",
	diskspace : "Disk space",
	types:'Types: ',
	platform:'Platform: ',
	release:'Release: ',
	archtype:'Archtype: ',
	refreshrate:'Refresh Rate: ',
	uptimerefreshrate:'Uptime refresh rate: ',
	cpurefreshrate:'CPU refresh rate: ',
	ramrefreshrate:'RAM refresh rate: ',
	swaprefreshrate:'Swap refresh rate: ',
	rowsperpage:'Rows per page: ',
	user:'User',
	startedlastrun:'Started / Last Run',
	elapsed:'Elapsed',
	cputime:'CPU Time',
	pintoworkspace:'Pin to Workspace',
	pinnedtoworkspace:'Pinned to workspace: ',
	unpinfromworkspace:'Unpin from Workspace',
	unpinnedfromworkspace:'Unpinned from workspace: ',
	uptime:'Uptime: ',
	days:'days',

	/*
	 * browse.jade
	 */
	fileinformation : "Click on a file in the Browse panel to see information or perform operations on it.",
	location : "Location",

	/*
	 * log_viewer.jade
	 */
	logtype : "Log type",
	partition : "Partition",
	nofileselected : "No file selected",
	rawfile : "Raw file",

	/*
	 * accounts.jade
	 */
	accounts : "Accounts",
	account : 'Account',
	groups : "Groups",

	/*
	 * admin_configs.jade
	 */
	components : "Components",
	swlicensessupport : "SW Licenses & Support",
	installationlogs : "Installation Logs",
	detailedconfiguration : "Detailed Configuration",

	/*
	 * audits.jade
	 */
	audits : "Audits",

	/*
	 * catalog_viewer.jadae
	 */
	catalogviewer : "Catalog Viewer",
	catalogfile : "Catalog File",
	viewcatalogxml : "View Catalog XML",

	/*
	 * change_ownership.jade
	 */
	changeownership : "Change Ownership",
	changeownershiphelptext : "The Change Ownership page allows you to select one or more users, and transfer all the objects they own to a new owner with a new policy.",
	policyid : "Policy ID",
	currentowners : "Current Owner(s)",
	newowner : "New Owner",
	changeowner : "Change Owner",

	/*
	 * clean.jade
	 */
	cleaning : "Cleaning",
	searchfor : "Search for",
	sqlsearchcriteria : "SQL search criteria",
	adddatabasesource : "Add database source",
	filesfound : "Files found",
	nothing : "Nothing",
	logdeleteat : "Log delete at",
	search : "Search",
	orphans:"Orphans",
	campaign:"Campaign",
	session:"Session",
	campaignfolder:"Campaign folder",
	sessionfolder:"Session folder",

	/*
	 * console.jade
	 */
	clearconsole : "Clear Console",
	help : "Help",
	command : "Command",
	pressingarrow : "Pressing the up or down arrow keys will cycle through previously used commands",

	/*
	 * debug_report.jade
	 */
	flowchartdebugreport : " Flowchart Debug Report",
	flowchart : "Flowchart",
	includecognoslogfiles : "Include Cognos Log Files",
	includewebserverlogfiles : "Include Web Server Log Files",
	downloadreport : "Download Report",

	/*
	 * env_report.jade
	 */
	generatereports : "Generate Report",

	/*
	 * environment_variables.jade
	 */
	environmentvariablesused : "The Environment Variables used by the ",
	ibm : "IBM",
	r : "®",
	campaignlistener : "Campaign Listener",
	canbeviewedmodifiedadded : " can be viewed, modified and added from this page. ",
	anychangesapplied : "Any changes applied here will be reset when the",
	isrestarted : "is restarted.",
	tooltipgreen: "Application is up and running.",
	tooltipred: "Application is down.",
	tooltiporange: "Verifying...",

        /*
	 * about.jade
	 */
         about_cleargoals: "Cleargoals",
         about_product: "Maestro",
         about_version: "Version : ",
         about_copyright: "Copyright 2016 Cleargoals Inc. All rights reserved.",
         about_statement_a: "CLEARGOALS is trademark of CLEARGOALS Company.",
         about_statement_b: "IBM Campaign, IBM Cognos, IBM WebSphere and any other IBM products listed within this interface are trademarks of International Business Machines Corporation in the United States, other countries or both, and also copyrights are also applied where appropriate.",

	/*
	 * recompute.html
	 */
	refreshedatabase : "Refreshes the database table metadata stored in catalogs and flowchart catalogs.",
	filetype : "File type",
	file : "File",
	allcatalogfiles : "Catalog Library",
	filecatalog : "Catalog File",
	fileflowchart : "Campaign Catalog File",
	filesession : "Session Catalog File",
	recordvalues : "Record counts and distinct values",
	recordcounts : " Record counts",
	distinctvalues : "Distinct values only",
	lastrecomputed : "Last recomputed all catalogs:",
	never : "never",
	showlastlog : "Show last run log",
	nodata : "No data",
	recomputetables : "Recompute",

	/*
	 * reports.jade
	 */
	reports : "Reports",
	report : "Report",
	reportgeneration : "Report Generation",
	getflowchartdata : "Get flowchart data",
	cell : "Cell",
	reporttype : "Report type",
	profile : "Profile",
	crosstab : "Crosstab",
	samplecontent : "Sample content",
	field : "Field(s)",
	age : "Age",
	city : "City",
	salary : "Salary",
	hholdid : "HHold_ID",
	household : "BASE_HOUSEHOLD.HHOLD_ID",
	numberofbins : "Number of bins",
	includemeta : "Include meta",
	numberofrecords : "Number of records",
	skipduplicate : "Skip duplicate cell ids",
	reportchartstable : "report charts and table stuffs here",
	defaultlabel:"default",

	/*
	 * run.jade
	 */
	run : "Run",
	flowchartfile : "Flowchart file",
	platformusername : "Platform username",
	synchronousrun : "Synchronous run",
	multipleflowcharts : "Multiple flowcharts",
	catalogfile : "Catalog file",
	xmlfile : "XML file",
	newlogfile : "New log file",
	addvariable : "Add Variable",
	runflowchart : "Run Flowchart",

	/*
	 * send_email.jade
	 */
	to : "To",
	group : "Group",
	add : "Add",
	subject : "Subject",
	body : "Body",
	predefined : "Predefined",
	custom : "Custom",
	emailsbygroup:"Emails by group",
	customemail:"Custom email",
	addallknownemails:"Add all known emails",
	ibmenvironmentrestart : "IBM Environment Restart",
	ibmenvironmentmaintenance : "IBM Environment Maintenance",

	/*
	 * start_stop.jade
	 */
	environment : "Environment",
	bounceenvironment : "Bounce Environment",
	stopenvironment : "Stop Environment",
	startenvironment : "Start Environment",
	restartenvironment : "Restart Environment",

	/*
	 * versions.jade
	 */
	versions : "Versions",
	utilityversion : "The utility versions can be viewed here. All up-to-date versions of the different utilities and technologies being used as part of the application are displayed for your convenience.",
	systemversioninformation : "System Version Information:",
	databaseversioninformation : "Database Version Information:",
	infrastructureinformation : "Infrastructure Information:",

	/*
	 * xml_viewer.jade
	 */
	xmlviewer : "XML Viewer",
	path : "Path",
	viewxml : "View XML",

	// == JAVASCRIPT ==//

	/*
	 * account.js
	 */
	unsavedchanges : 'You have pending unsaved changes. Do you really want to discard them?',
	error : 'Error',
	needauthenticationservice : 'An account must either have an Authentication Service such as LDAP or Marketing, or be provided with a Password to authenticate locally.',

	/*
	 * accounts.js
	 */
	addnewaccount : 'Add New Account',
	bookmarks:'Bookmarks',
	remove:'Remove',
	bookmarkname:'Name',
	bookmarkurl:'URL',
	filesystempermissions:'File system permissions',
	orderrandking:'Order Ranking',
	canarchive:'Can Archive',
	candownload:'Can Download',
	canupload:'Can Upload',
	candelete:'Can Delete',
	propagate:'Propagate to subfolders',

	/*
	 * change_ownership.js
	 */
	changedownership : 'Succesfully changed ownership',

	/*
	 * JSONBrowser.js
	 */
	authenticationservice:'Authentication Service',
	password:'Password',
	email:'Email',
	status:'Status',
	note:'Note',
	language:'Language',
	first:'First',
	middle:'Middle',
	last:'Last',
	office:'Office',
	mobile:'Mobile',
	username:'Username',
	groups:'Groups',

	permissions:'Permissions',
	chooseanitemtoadd:'Choose an item to add',
	youmustprovide:'You must provide ',
	alreadyexists:' already exists. ',
	hastobeunique:' has to be unique.',
	duplicate:'Duplicate',
	unresolvederror:'Unresolved errors',
	inputerrors:'You have errors in your input data. Please fix them.',
	willdelete: 'will be permanently deleted. This action cannot be undone. Do you wish to proceed?',
	filterresults: 'Type to filter results',
	name:'Name',
	phone:'Phone',
	ibmmarketing:'IBM Marketing',
	groupspermissions:'Groups & Permissions',
	viewablefiletypes:'Viewable file types',
	users:'Users',
	newgroup:'New Group',
	cancel:'Cancel',
	save:'Save',
	deleteitem:"Delete",

	/*
	 * clean.js
	 */
	cleanuputility : 'Are you sure that you want to execute the IBM Campaign Cleanup Utility (acclean) with the following parameters? <br><br>',
	cleanuputilitynoflowchartsessions : 'In order to run the IBM Campaign Cleanup Utility (acclean), no Flowchart or User Sessions must be running and the IBM Campaign Listener must be down.',
	areyousure : 'Are you sure?',
	campaigncurrentlyrunning: ' IBM Campaign Flowchart session(s) are currently running.<br>',
	currentlyconnected: ' user(s) are currently connected to IBM Campaign.<br>',
	listenerrunning: 'The IBM Campaign Listener is running.<br>',
	stepsclean: '</span><br>Please follow these steps: <br>(1) Stop or Suspend all running flowcharts <br>(2) Ask all users to logoff, or kill their sessions (not recommended) <br>(3) Stop the IBM Campaign Listener.',
	shutdowncampaign: 'Shut down Campaign Listener',
	consolenotice: "This console can be used to run commands against the <strong>unica_svradm</strong> utility<br><br>",
	availablecommands: 'Available commands:',
	yes: 'Yes',
	cancel: 'Cancel',
	changevalue1: 'Are you sure that you want to change the value of this variable (<strong>',
	changevalue2: '</strong>)? <br><br>Changing these variables can have a real-time impact on how IBM Campaign is running and could potentially impact current activities within IBM Campaign.',
	successfullysentemail: 'Successfully sent email',
	successfullychangedpassword: 'Successfully changed password',
	acceptedssl1: "Make sure you accepted the <a href='",
	acceptedssl2: "' target='_blank'>SSL</a>. <br>",
	acceptedssl3: "Check your connection to the internet. <br>",
	acceptedssl4: "It is also possible the server is down.",
	sessionexpired: 'Your previous session has expired.',
	notauthorized: 'Not authorized',
	accessdenied: 'Access denied',
	notfound: 'Not found',
	encounteredconflict: 'Encountered conflict',
	campaignnotrunning: 'Campaign Listener is not running',
	campaignutilityerror: 'Campaign utility error',
	cannotconnectserver: 'Cannot connect to server',

	/*
	 * session_manager.js
	 */
	refresh:"Refresh",
	settings:"Settings",

	triggername:"Trigger name",
	broadcastto:"Broadcast to",
	campaigncode:"Campaign Code",
	flowchartname:"Flowchart name",
	campaigflowchart:'Campaign Code/Flowchart name',
	showingfiles:'Showing files:',
	hostname:"Host Name",
	sslconnection:"SSL Connection",
	couldnotproceed:"Could not proceed with action",
	wasalreadyrunning:" was already running",
	youareabouttoshutdown:"You are about to shut down and restart ",
	thisprocesscantaketenfifteenseconds:". This process can take 10-15 seconds.",
	missing:" Missing",
	searchforlog:"Search for log file...",
	sending:"Sending...",
	starttime:"Start time",
	endtime:"End time",
	whenstring:"When",
	resultcode:"Result Code",

	/*
	 * jquery datatables
	 */
	datatableloadingrecords: "Loading...",
	datatableinfo:"Showing _START_ to _END_ of _TOTAL_ entries",
	datatablesortascending:": activate to sort column ascending",
	datatablesortdescending:": activate to sort column descending",
	datatableemptytable:"No data available in table",
	datatableinfoempty:"Showing 0 to 0 of 0 entries",
	datatableinfofiltered:"(filtered from _MAX_ total entries)",
	datatablelengthmenu:"Show _MENU_ entries",
	datatablepaginatefirst:"First",
	datatablepaginatelast:"Last",
	datatablepaginatenext:"Next",
	datatablepaginateprevious:"Previous",
	datatableprocessing:"Processing...",
	datatablesearch:"Search:",
	datatablezerorecords:"No matching records found",

	timeuntilrestart:"Time Until Restart",
	contactemail:"Contact Email",
	contactphone:"Contact Phone",
	subject:"Subject",
	body:"Body",
	startdate:"Start Date",
	enddate:"End Date",
	missingemailclientconfig:"Missing Email Client configuration",
	ibmemmenvironmentrestart:"IBM EMM Environment will be restarted in [time until restart]",
	ibmemmenvironmentrestartmessage:"The IBM EMM environment will be restarted in [time until restart]. Please make sure that you save any ongoing work and log off before the environment is restarted.<br><br>Current server time is [getServerDate]<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.",
	ibmemmenvironmentmaintenance:"Scheduled IBM EMM Environment Maintenance - System will be unavailable",
	ibmemmenvironmentmaintenancemessage:"Please note that the IBM EMM environment will be unavailable between [start date] and [end date].<br><br>Please make sure that you save any ongoing work and log off before the system maintenance starts.<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.",

	analyze:"Analyze",
	logLevel:"Log Level",
	action:"Action",
	anyOption:"Match Any Options Below",
	allOptions:"Match All Options Below",
	switchTheme:"Switch Theme"
}
