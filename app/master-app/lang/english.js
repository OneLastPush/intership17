/*
 * Used in Jade pages (http://jade-lang.com/reference/)
 * All lang files should have the same keys
 * Examle use in Jade:
 *
 * p=version
 *
 * div
 * 	|=about
 *
 * h3
 *  | #{advanced} #{dashboard}
 */

var dataTable = {
	filterResults: 'Type to filter results',

	all: 'All',

	loadingRecords: 'Loading...',
	info: 'Showing _START_ to _END_ of _TOTAL_ entries',
	aria: {
		sortAscending: 'Activate to sort column in ascending',
		sortDescending: 'Activate to sort column in descending'
	},
	emptyTable: 'No data available in table',
	infoEmpty: 'Showing 0 to 0 of 0 entries',
	processing: 'Processing...',
	infoFiltered: '(filtered from _MAX_ total entries)',
	lengthMenu: 'Showing _MENU_ entries',
	search: 'Search',
	zeroRecords: 'No matching records found',
	paginate: {
		first: 'First',
		previous: 'Previous',
		next: 'Next',
		last: 'Last'
	}
};
var actions = {
	pin: 'Pin to workspace',
	unpin: 'Unpin from workspace',
	logFile: 'View log file',
	save: 'Save',
	trigger: 'Broadcast inbound trigger',
	run: 'Run',
	suspend: 'Suspend',
	stop: 'Stop',
	kill: 'Kill'
};
var flowchartManager = {
	action: 'Action',
	campaign_session: 'Campaign/Session',
	flowchart: 'Flowchart',
	type: 'Type',
	loginSession: 'Login session',
	campaignFlowchart: 'Campaign flowchart',
	sessionFlowchart: 'Session flowchart',
	user: 'User',
	pid: 'PID',
	startTime: 'Start time',
	elapsedTime: 'Elapsed Time',
	cpuUptime: 'CPU uptime',
	file: 'File',
	id: 'ID',
	svr: 'svr',
	writer: 'Writer',
};
var runResponses = {
	success: 'Successfully ran flowchart',
	alreadyRunning: 'Flowchart is already running',
	error: 'An error occured...',
	cannotOpen: 'Cannot open file'
};
var trigger = {
	broadcast: 'Broadcast',
	broadcasting: 'Broadcasting',
	broadcastTo: 'Broadcast to',
	cCodeOrName: 'Campaign code or flowchart name',
	flowchartName: 'Flowchart name',
	campaignCode: 'Campaign code',

	noFlowchart: 'There is no running flowchart with that pid',
	aFlowchart: 'A flowchart',
	wholeCampaign: 'Whole Campaign',
	allCampaigns: 'All Campaigns',
	broadcastInboundTrigger: 'Browadcast Inbounce Trigger',
	to: 'to'
};
var JSONBrowser = {
	addNew: 'New',
	filter: 'Type to filter list',

	save: 'Save',
	saving: 'Saving...',
	remove: 'Delete',
	removing: 'Deleting...',
	clear: 'Cancel',

	unsavedTitle: 'You have unsaved changes',
	unsavedMsg: 'Are you sure you want to do that? There are unsaved changes and they will be lost.',
	unsavedDiscard: 'Discard changes',

	errorTitle: 'Error',
	errorMsg: 'You have unresolved errors. Please fix them first.',

	removeTitle: 'Are you sure?',
	removeMsg: 'This will delete this record permanently.',
	removeYes: 'Yes',
	removeNo: 'No',

	removeItem: 'Remove',
	addItem: 'Add',
	dropdownAdd: 'Choose an item to add',

	none: 'None'
};
var users = {
	Username: 'Username',
	Password: 'Password',
	'Authentcation Service': 'Authentication Service',
	Language: 'Language',
	Email: 'Email',
	Status: 'Status',
	Note: 'Note',
	'IBM Marketing': 'IBM Marketing',
	'IBM Marketing.Username': 'Username',
	'IBM Marketing.Password': 'Password',
	Name: 'Name',
	'Name.First': 'First Name',
	'Name.Last': 'Last Name',
	'Name.Middle': 'Middle Name',
	Phone: 'Phone Numbers',
	'Phone.Office': 'Office Number',
	'Phone.Mobile': 'Mobile Number',
	Bookmarks: 'Bookmarks',
	'Groups & Permissions': 'Groups & Permissions',
	'Groups & Permissions.Groups': 'Groups',
	'Groups & Permissions.Permissions': 'Permissions',

	bookmarksKeyPlaceholder: 'Bookmark name',
	bookmarksValuePlaceholder: 'Bookmark URL'
};
var groups = {
	Name: 'Name',
	Users: 'Users',
	Permissions: 'Permissions',
	'Viewable file types': 'Viewable file types',
	'File system permissions': 'File system permissions',

	orderranking: 'Ranking order',
	candownload: 'Can download',
	canupload: 'Can upload',
	canarchive: 'Can archive',
	candelete: 'Can delete',
	propagate: 'Propogates permissions to subfolders'
};
var userTypes = {
	active: 'Active users',
	disabled: 'Disabled users',
	deleted: 'Deleted users'
};
var rawFile = {
	tail: 'End of file',
	head: 'Beginning of file',
	whole: 'Whole file',
	refreshRate: 'Refresh rate (seconds)',
	lines: 'Lines shown',
	download: 'Download'
};
var startStop = {
	campaign: {
		startTitle: 'Start Campaign Listener',
		startMsg: 'Would you like to resume any previously "suspended" IBM Campaign Flowchart sessions (if any)? If yes, this could take a few minutes to execute (it is normally recommended to answer "yes")',
		resumingSessions: 'Resuming sessions',
		savingSessions: 'Saving sessions',
		startingCampaign: 'Starting Campaign Listener',
		startingOptimizer: 'Starting Contact Optimization Listener',

		shutdownTitle: 'Shutdown Campaign Listener',
		shutdownMsg: 'Would you like to save all IBM Campaign Flowchart sessions that are currently running? If yes, this could take a few minutes, as each running flowchart needs to get to a point of execution where things can be save safely.',
		suspendingSessions: 'Suspending sessions',
		stoppingSessions: 'Stopping sessions',
		stoppingCampaign: 'Stopping Campaign Listener',
		forceShutownTitle: 'Force Shutdown Campaign Listener',
		forceShutdownMsg: 'Are you sure that you want to issue a force shutdown? WARNING: Any unsaved flowchart, changes or ongoing flowchart execution will be lost. Use this option with care (we normally recommend using the standard "shutdown" command instead)',
		stoppingOptimizer: 'Stopping Contact Optimization Listener'
	},
	yes: 'Yes',
	no: 'No'
};

module.exports = {
	version: 'English',
	global: { //DO NOT put values here if they are used on specific page. KEEP THIS MINIMAL. Thankyou.
		errors: {
			error: 'Error',
			sessionexpired: 'Your previous session has expired.',
			notauthorized: 'Not authorized',
			accessdenied: 'Access denied',
			notfound: 'Not found',
			encounteredconflict: 'Encountered conflict',
			cannotconnectserver: 'Cannot connect to server'
		},
		conversions: { days: 'days' },
		//multiple re-uses... be best to NEVER add to this
		partition : 'Partition'
	},
	header: {
		navigation: 'Navigation',
		dashboard : 'Dashboard',
		workspace : 'Workspace',
		browse : 'Browse',
		maintenance : 'Maintenance',
		advanced : 'Advanced',
		inboundTrigger : 'Inbound Trigger',
		logViewer : 'Log Viewer',
		recompute : 'Recompute',
		clean : 'Clean',
		changeOwnership : 'Change Ownership',
		sendEmail : 'Send Email',
		audits : 'Audits',
		environmentReport : 'Environment Report',
		console : 'Console',
		startStop : 'Start / Stop',
		environmentVariables : 'Environment Variables',
		versions : 'Versions',
		configuration : 'Configuration',
		manageAccounts : 'Manage Accounts',
		about : 'About',

		account: 'Settings',
		logout: 'Logout',
		bookmarks: 'Bookmarks'
	},
	login: {
		signIn: 'Sign In',
		daysLeft: ' days left in license.',
		js: {
			resetPassword: 'Click here to reset your password',
			resetDisclaimer: '(only for Internal users. LDAP and IBM EMM users contact your system administrator)'
		}
	},
	login_reset: {
		resetEmail: '1. Send Reset Email',
		resetPassword: '2. Reset Password',
		email: 'Email',
		username: 'Username',
		sendResetEmail: 'Send reset email',
		sending: 'Sending...',
		passwordToken: 'Emailed password token',
		newPassword: 'New password',
		confirmPassword: 'Confirm password',
		changePassword: 'Change password',
		changing: 'Changing...',
		js:{
			successfullySentEmail: 'Successfully sent email',
			successfullyChangedEmail: 'Successfully changed password'
		}
	},
	dashboard: {
		//shared
		refreshRate: 'Refresh rate',
		seconds: 'Secs',

		//session manager
		sessionManager: 'Session Manager',
		sessions: 'Sessions',
		users: 'Users',

		//servers
		servers : 'Servers',
		os: 'Operating system',
		type: 'Type',
		platform: 'Platform',
		release: 'Release',
		archtype: 'Archtype',
		nics: 'Network interface cards',
		uptime: 'Uptime',
		uptimeRefreshRate: 'Uptime refresh rate',
		cpu: 'CPU',
		cpuRefreshRate: 'CPU refresh rate',
		ram: 'RAM',
		ramRefreshRate: 'RAM refresh rate',
		swap: 'Swap',
		swapRefreshRate: 'Swap refresh rate',

		js: {
			//shared
			refresh: 'Refresh',
			settings: 'Settings',

			//servers
			name: 'Name',

			//session manager
			manager: flowchartManager,
			dataTable: dataTable,
			context: actions,
			run: runResponses,
			trigger: trigger
		}
	},
	workspace: {
		refreshRate: 'Refresh rate',
		seconds: 'Secs',

		js: {
			refresh: 'Refresh',
			settings: 'Settings',

			manager: flowchartManager,
			dataTable: dataTable,
			context: actions,
			run: runResponses,
			trigger: trigger
		}
	},
	browse: {
		fileInfo: 'Click on a file in the Browse panel to see information or perform operations on it.',
		location: 'Location',
		showingFilesWithExt: 'Showing files with extensions',
		noExt: 'No extensions have been configured for your groups',
		js: {
			importCampaign: 'Import Campaign',
			userTypes: userTypes,
			alreadyExists: {
				title: 'This file already exists',
				1: 'already exists in',
				overwrite: 'Overwrite'
			},
			archiveConfirm: {
				title: 'Are you sure you want to archive this file?',
				1: 'Are you sure you want to archive',
				2: '?',
				archive: 'Archive'
			},
			deleteConfirm: {
				title: 'Are you sure you want to delete this file?',
				1: 'Are you sure you want to delete',
				2: '?',
				delete: 'Delete'
			},
			run: runResponses,
			browser: {
				loading: 'Loading...',
				loadError: 'Load error',
				moreData: 'More...',
				noData: 'No data'
			},
			file: {
				empty: 'Click on a file in the Browse panel to see information or perform operations on it.',

				path: 'Path',
				name: 'Name',
				extension: 'Extension',
				size: 'Size',
				created: 'Created',
				modified: 'Last modified',
				accessed: 'Last accessed',
				permissions: 'Permissions',
				owner: 'Owner',
				group: 'Group',

				import: 'Import Campaign',
				downloadFolder: 'Download as zip',
				upload: 'Upload file',
				run: 'Run',
				pin: 'Pin to workspace',
				unpin: 'Unpin from workspace',
				recompute: 'Recompute',
				viewLog: 'View log',
				report: 'Debug report',
				download: 'Download',
				file: 'File',
				catalog: 'Catalog',
				campaign: 'Campaign',
				viewCatalog: 'View catalog',
				viewContents: 'View contents',
				archive: 'Archive',
				delete: 'Delete'
			}
		}
	},
	inbound_trigger: {
		js: {
			trigger: trigger
		}
	},
	log_viewer: {
		logType: 'Log type',
		partition: 'Partition',
		noFileSelected: 'No file selected',
		rawFile: 'Raw file',
		analyze: 'Analyze',
		browse: 'Browse',
		js: {
			rawFile: rawFile,
			analyzer: {
				logLevel: 'Log Level',
				action: 'Action',
				anyOption: 'Match ANY options below',
				allOptions: 'Match ALL options below',
				switchTheme: 'Switch Theme'
			},
			browser: {
				filter: 'Filter',
				categoryLabel: 'processes',
				noFileSelected: 'No file selected',
				noLogFileSelected: 'No log file selected',
				emptyLogFile: 'This log file is empty'
			},
			searchForLog: 'Search for log file...'
		}
	},
	clean: {
		options: 'Options',
		searchFor: 'Search for',
		orphans: 'Orphans',
		flowchart: 'Flowchart',
		campaign: 'Campaign',
		session: 'Session',
		campaignFolder: 'Campaign folder',
		sessionFolder: 'Session folder',
		sqlSearch: 'SQL search criteria',
		search: 'Search',
		searching: 'Searching...',

		filesFound: 'Files found',
		nothing: 'Nothing',
		cleanFiles: 'Clean files',
		cleaning: 'Cleaning...',

		logDeleteAt: 'Log delete at',
		low: 'Low',
		medium: 'Medium',
		high: 'High',
		all: 'All',
		js: {
			startStop: startStop,

			areYouSure: 'Are you sure?',
			areYouSureMsg: 'Are you sure that you want to execute the IBM Campaign Cleanup Utility (acclean) with the following parameters? <br><br>',
			yes: 'Yes',
			no: 'No',

			cleanUpCheckMsg: 'In order to run the IBM Campaign Cleanup Utility (acclean), no Flowchart or User Sessions must be running and the IBM Campaign Listener must be down.',
			currentlyRunning: 'IBM Campaign Flowchart session(s) are currently running.',
			currentlyConnected: 'user(s) are currently connected to IBM Campaign.',
			listenerRunning: 'The IBM Campaign Listener is running',
			followSteps: 'Please follow these steps',
			step1: 'Stop or Suspend all running flowcharts',
			step2: 'Ask all users to logoff, or kill their sessions (not recommended)',
			step3: 'Stop the IBM Campaign Listener.',
			shutdownCampaign: 'Shut down Campaign Listener',
		}
	},
	change_ownership: {
		changeOwnership: 'Change Ownership',
		changeOwnershipDesc: 'The Change Ownership page allows you to select one or more users, and transfer all the objects they own to a new owner with a new policy.',
		policyId: 'Policy ID',
		currentOwners: 'Current Owner(s)',
		newOwner: 'New Owner',
		changeOwner: 'Change Owner',
		changingOwner: 'Changing ownerhsip...',
		js: {
			userTypes: userTypes,
			changedOwnership: 'Succesfully changed ownership'
		}
	},
	send_email: {
		to: 'To',
		group: 'Group',
		emailsByGroup: 'Emails by group',
		customEmail: 'Custom email',
		addAllKnownEmails: 'Add all known emails',
		add: 'Add',

		predefined: 'Predefined',
		restart: 'IBM Environment Restart',
		maintenance: 'IBM Environment Maintenance',
		custom: 'Custom',

		sendEmail: 'Send Email',
		subject: 'Subject',
		body: 'Body',
		sendingEmail: 'Sending Email...',
		js: {
			restartSubject: 'IBM EMM Environment will be restarted in [time until restart]',
			restartBody: 'The IBM EMM environment will be restarted in [time until restart]. Please make sure that you save any ongoing work and log off before the environment is restarted.<br><br>Current server time is [server time]<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.',
			maintenanceSubject: 'Scheduled IBM EMM Environment Maintenance - System will be unavailable',
			maintenanceBody: 'Please note that the IBM EMM environment will be unavailable between [start date] and [end date].<br><br>Please make sure that you save any ongoing work and log off before the system maintenance starts.<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.',

			emailConfigIssue: 'Missing email client configuration',

			template: {
				subject: 'Subject',
				body: 'Body',

				//contact info
				name: 'Name',
				'contact email': 'Contact Email',
				'contact phone': 'Contact Phone',

				//restart
				'time until restart': 'Time Until Restart',
				'server time': 'Server Time',

				//maintenance
				'start date': 'Start Date',
				'end date': 'End Date'
			}
		}
	},
	account: {
		js: {
			generic: JSONBrowser,
			users: users,
			remove: 'Remove',
			add: 'Add'
		}
	},
	accounts: {
		accounts : 'Accounts',
		groups : 'Groups',
		js: {
			generic: JSONBrowser,
			groups: groups,
			users: users,
			remove: 'Remove',
			add: 'Add'
		}
	},
	admin_configs: {
		components : 'Components',
		swlicensessupport : 'SW Licenses & Support',
		installationlogs : 'Installation Logs',
		js: {
			reqField: 'Required field'
		}
	},
	audits: {
		audits : 'Audits',
		whenstring:'When',
		resultcode:'Result Code',
		user:'User',
		starttime:'Start time',
		endtime:'End time',
		js: {
			datatableloadingrecords: 'Loading...',
			datatableinfo:'Showing _START_ to _END_ of _TOTAL_ entries',
			datatablesortascending:': activate to sort column ascending',
			datatablesortdescending:': activate to sort column descending',
			datatableemptytable:'No data available in table',
			datatableinfoempty:'Showing 0 to 0 of 0 entries',
			datatableinfofiltered:'(filtered from _MAX_ total entries)',
			datatablelengthmenu:'Show _MENU_ entries',
			datatablepaginatefirst:'First',
			datatablepaginatelast:'Last',
			datatablepaginatenext:'Next',
			datatablepaginateprevious:'Previous',
			datatableprocessing:'Processing...',
			datatablesearch:'Search:',
			datatablezerorecords:'No matching records found'
		}
	},
	catalog_viewer: {
		catalogViewer: 'Catalog Viewer',
		catalogFile: 'Catalog File',
		partition: 'Partition',
		viewCatalogXml: 'View Catalog XML',
		loadingCatalogXml: 'Loading Catalog XML...'
	},
	console: {
		clearconsole : 'Clear Console',
		help : 'Help',
		command : 'Command',
		pressingarrow : 'Pressing the up or down arrow keys will cycle through previously used commands'
	},
	debug_report: {
		flowchartdebugreport : ' Flowchart Debug Report',
		flowchart : 'Flowchart',
		includecognoslogfiles : 'Include Cognos Log Files',
		includewebserverlogfiles : 'Include Web Server Log Files',
		downloadreport : 'Download Report'
	},
	env_report: {
		generatereports : 'Generate Report'
	},
	environment_variables: {
		environmentvariablesused : 'The Environment Variables used by the ',
		ibm : 'IBM',
		r : '®',
		campaignlistener : 'Campaign Listener',
		canbeviewedmodifiedadded : ' can be viewed, modified and added from this page. ',
		anychangesapplied : 'Any changes applied here will be reset when the',
		isrestarted : 'is restarted.',
		tooltipgreen: 'Application is up and running.',
		tooltipred: 'Application is down.',
		tooltiporange: 'Verifying...',
		js: {
			areyousure : 'Are you sure?',
			cancel:'Cancel',
			changevalue2: '</strong>)? <br><br>Changing these variables can have a real-time impact on how IBM Campaign is running and could potentially impact current activities within IBM Campaign.',
			changevalue1: 'Are you sure that you want to change the value of this variable (<strong>',
			yes: 'Yes'
		}
	},
	about: {
		cleargoals: 'Cleargoals',
		product: 'Maestro',
		version: 'Version',
		copyright: 'Copyright 2016 Cleargoals Inc. All rights reserved.',
		statement_a: 'CLEARGOALS is trademark of CLEARGOALS Company.',
		statement_b: 'IBM Campaign, IBM Cognos, IBM WebSphere and any other IBM products listed within this interface are trademarks of International Business Machines Corporation in the United States, other countries or both, and also copyrights are also applied where appropriate.'
	},
	recompute: {
		refreshedatabase : 'Refreshes the database table metadata stored in catalogs and flowchart catalogs.',
		filetype : 'File type',
		file : 'File',
		allcatalogfiles : 'Catalog Library',
		filecatalog : 'Catalog File',
		fileflowchart : 'Campaign Catalog File',
		filesession : 'Session Catalog File',
		recordvalues : 'Record counts and distinct values',
		recordcounts : ' Record counts',
		distinctvalues : 'Distinct values only',
		lastrecomputed : 'Last recomputed all catalogs:',
		never : 'never',
		showlastlog : 'Show last run log',
		nodata : 'No data',
		recomputetables : 'Recompute',
		remove:'Remove'
	},
	reports: {
		reports : 'Reports',
		report : 'Report',
		reportgeneration : 'Report Generation',
		getflowchartdata : 'Get flowchart data',
		cell : 'Cell',
		reporttype : 'Report type',
		profile : 'Profile',
		crosstab : 'Crosstab',
		samplecontent : 'Sample content',
		field : 'Field(s)',
		age : 'Age',
		city : 'City',
		salary : 'Salary',
		hholdid : 'HHold_ID',
		household : 'BASE_HOUSEHOLD.HHOLD_ID',
		numberofbins : 'Number of bins',
		includemeta : 'Include meta',
		numberofrecords : 'Number of records',
		skipduplicate : 'Skip duplicate cell ids',
		reportchartstable : 'report charts and table stuffs here',
		defaultlabel:'default'
	},
	run: {
		run : 'Run',
		flowchartfile : 'Flowchart file',
		platformusername : 'Platform username',
		synchronousrun : 'Synchronous run',
		multipleflowcharts : 'Multiple flowcharts',
		catalogfile : 'Catalog file',
		xmlfile : 'XML file',
		newlogfile : 'New log file',
		addvariable : 'Add Variable',
		runflowchart : 'Run Flowchart',
		remove:'Remove',
		js: {
			userTypes: userTypes
		}
	},
	start_stop: {
		environment : 'Environment',
		bounceenvironment : 'Bounce Environment',
		stopenvironment : 'Stop Environment',
		startenvironment : 'Start Environment',
		restartenvironment : 'Restart Environment',
		js: {
			startStop: startStop,
			hostname:'Host Name',
			sslconnection:'SSL Connection',
			tooltipgreen: 'Application is up and running.',
			tooltipred: 'Application is down.',
			tooltiporange: 'Verifying...',
			couldnotproceed:'Could not proceed with action',
			wasalreadyrunning:' was already running',
			areyousure : 'Are you sure?',
			youareabouttoshutdown:'You are about to shut down and restart ',
			thisprocesscantaketenfifteenseconds:'. This process can take 10-15 seconds.'
		}
	},
	versions: {
		versions : 'Versions',
		utilityversion : 'The utility versions can be viewed here. All up-to-date versions of the different utilities and technologies being used as part of the application are displayed for your convenience.',
		systemversioninformation : 'System Version Information:',
		databaseversioninformation : 'Database Version Information:',
		infrastructureinformation : 'Infrastructure Information:'
	},
	xml_viewer: {
		xmlviewer : 'XML Viewer',
		path : 'Path',
		viewxml : 'View XML'
	},
	qa_component_details: {
		component : 'Components',
		createeditcomp : 'Create New or Edit Component',
		name : 'Name',
		description : 'Description',
		category : 'Category',
		author : 'Author',
		type : 'Type',
		test : 'Test Query',
		save : 'Save Component',
		clear : 'Clear',
		sqlLabel : 'SQL',
		sqlPlaceholder : 'Enter an SQL query here',
		groupingOverlay : 'Grouping overlay',
		groupingOverlayLeft : 'Groups',
		groupingOverlayRight : 'Order',
		saveGrouping : 'Save Changes',
		closeGrouping : 'Close',
		componentViewerTitle : "Component Viewer",
		searchComponent : "Search",
		searchComponentPlaceholder : "Search for a component",
		addCategory : "Add Category",
		categoryName : "Enter a category name",
		newComponent : "New Component",
		deleteComponent : "Delete Component",
		deleteCategory : "Delete Category",
		js : {
			err : {
				nullAuthor : 'Author must not be null.',
				nullDesc : 'Description must not be null.',
				nullCat : 'Category must not be null.',
				nullType : 'Type must not be null.',
				nullName : 'Name must not be null.',
				nullTable : 'Table name must not be null.',
				nullQuery : 'Query must not be null.',
				invalidTable : 'Table does not exist.',
				invalidType : 'Type is invalid. Possible types: Static, Dynamic, Strategic',
				invalidName : 'Name already exists.',
				invalidGroups : 'Groups given do not match groups in table',
				invalidSQL : 'SQL can only contain DML statements.',
				retrieveColumns : 'An error occurred while retrieving the columns.',
				invalidColumns : 'Invalid number of columns.',
				retrieveGroups : 'An error occurred while getting the groups.',
				tableNotCreated : 'The table could not be created.',
				retrieveTableName : 'An error occurred while getting the temporary table name.',
				noData : 'No data could be found in the table',
				errorGetCategoriesAndComponents: 'Encountered an error fetching categories and components.',
				errorAddCategory: 'Encountered an error adding the new category.',
				categoryAlreadyExists: 'Encountered an error adding the new category: the category already exists.',
				errorRemoveCategory: 'Encountered an error removing the existing category.',
				categoryHasComponents: 'Failed to remove the category because it contains components. Consider deleting it\'s components first',
				categoryDoesNotExist: 'Failed to remove the category because it does not exist.',
				errorRemoveComponent: 'Encountered an error removing the existing component.',
				componentDoesNotExist: 'Failed to remove the component because it does not exist.',
				errorGetCategories: 'Encountered an error fetching categories.',
				errorGetComponents: 'Encountered an error fetching components.',
				general : 'An error occurred.',
				nameLength : 'Name must be less than 256 characters.',
				descLength : 'Description must be less than 256 characters.',
				authorLength : 'Author must be less than 256 characters.',
				catLength : 'Category must be less than 256 characters.',
			},
			save : 'Save Component',
			groups : 'Define Groups',
			static : 'Static',
			dynamic : 'Dynamic',
			strategic : 'Strategic',
			successfullyCreatedTable : 'Successfully created table.',
			error: 'Error',
			cancel: 'Cancel',
			confirm: 'Confirm',
			areYouSure: 'Are you sure?'
		}
	},
	qa_report_builder : {
		js : {
			total : 'Total'
		}
	}
};