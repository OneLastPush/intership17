/*
 * README
 * each key must correspond to class value
 * example :
 * 	objectLanguage.version for the key 'version', it has to be the same value's class in <span class="lang-version" />
 *  objectLanguage.test for the key 'test', it has to be the same value's class in <span class="lang-test" />
 *
 */

/* replace word for short word if size screen < 768px
 * @author Olga Zlotea
 */
 function shortName(name,shName){
	//var widthBody = screen.width;
	var widthBody = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
	//var h = screen.height;
	var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	var nameDisplay = (widthBody<768) ? shName : name;
	return nameDisplay;
};

var objectLanguage = {
	version : "Français",

	/*
	 * header.jade
	 */
	dashboard : "Tableau de bord",
	workspace : "Espace de travail",
	browse : "Explorateur",
	maintenance : "Maintenance",
	advanced : "Avancée",
	inboundtrigger : "Événement entrant",
	logviewer : "Visualiser l'historique",
	recompute : "Recompute",
	clean : "Nettoyer",
	changeownership : "Changer de propriétaire",
	sendemail : "Envoi d'email",
	audits : "Audits",
	environmentreport : "Rapports d'environnement",
	console : "Console",
	startstop : "Commencer / Arrêter",
	environmentvariables : "Variables d'environnement",
	versions : "Versions",
	configuration : "Configuration",
	manageaccounts : "Gestion des comptes",
	about : "À Propos",
    

	/*
	 * dashboard.jade
	 */
	sessionmanager : "Gestionnaire des sessions",
	servers : "Serveurs",
	operatingsystem : " Systèmes d'exploitation",
	networkinterfacecards : "Interfaces réseau",
	swapspace : "Espace Swap",
	diskspace : "Espace Disque",
	types:'Types: ',
	platform:'Plate-forme: ',
	release:'Version: ',
	archtype:'Architecture: ',
	refreshrate:'Temps de rafraîchissement: ',
	uptimerefreshrate:'Uptime temps de rafraîchissement: ',
	cpurefreshrate:'CPU temps de rafraîchissement: ',
	ramrefreshrate:'RAM temps de rafraîchissement: ',
	swaprefreshrate:'Swap temps de rafraîchissement: ',
	rowsperpage:'Lignes par page: ',
	user:'Utilisateur',
	startedlastrun:'Commencement / Dernier Run',
	elapsed:'Passé',
	cputime:'Temp de CPU',
	pintoworkspace:'Broches au Workspace',
	pinnedtoworkspace:'Brocheé au workspace: ',
	unpinfromworkspace:'Debroches du Workspace',
	unpinnedfromworkspace:'Debrochée du workspace: ',
	uptime:'Actif Depuis: ',
	days:"jours",

	/*
	 * browse.jade
	 */
	fileinformation : "Sélectionner un fichier dans l'explorateur pour afficher les informations et actions disponibles.",
	location : "Emplacement",

	/*
	 * log_viewer.jade
	 */
	logtype : "Type des logs",
	partition : "Partitions",
	nofileselected : "Aucun fichier sélectionné",
	rawfile : "Fichier brut",

	/*
	 * accounts.jade
	 */
	accounts : "Comptes",
	account:"Compte",
	groups : "Groupes",

	/*
	 * admin_configs.jade
	 */
	components : "Composants",
	swlicensessupport : "SW Licenses & Support",
	installationlogs : "Installation de l'historique",
	detailedconfiguration : "Details de configuration",

	/*
	 * audits.jade
	 */
	audits : "Audits",

	/*
	 * catalog_viewer.jadae
	 */
	catalogviewer : "Visualiseur des catalogues",
	catalogfile : "Catalogue des fichiers",
	viewcatalogxml : "Visualiser le catalogue XML",

	/*
	 * change_ownership.jade
	 */
	changeownership : "Changement de propriétaire",
	changeownershiphelptext : "La page 'changement de propriétaire' autorise la selection de un ou plusieurs utilisateurs et transfert les objets des anciens proprietaire vers les nouveaux.",
	policyid : "identifiant de la politique",
	currentowners : "Propriétaire courant",
	newowner : "Nouveau propriétaire",
	changeowner : "Changer le propriétaire",

	/*
	 * clean.jade
	 */
	cleaning : "Nettoyer",
	searchfor : "Rechercher",
	sqlsearchcriteria : "Critères SQL de recherche",
	adddatabasesource : "Ajout d'une donnée source",
	filesfound : "Fichier trouvé",
	nothing : "Vide",
	logdeleteat : "Historique supprimé à",
	search:"Recherche",
	orphans:"Orphelin",
	campaign:"Campaign",
	session:"Session",
	campaignfolder:"Dossier Campaign",
	sessionfolder:"Dossier Session",

	/*
	 * console.jade
	 */
	clearconsole : "Nettoyer la console",
	help : "Aide",
	command : "Commande",
	pressingarrow : "Utiliser les touches directionnelles pour voir les commandes précédentes",

	/*
	 * debug_report.jade
	 */
	flowchartdebugreport : "Organigramme des rapports de débogue",
	flowchart : "Organigramme",
	includecognoslogfiles : "Inclure l'historique Cognos",
	includewebserverlogfiles : "Inclure l'historique du serveur web",
	downloadreport : "Télécharger un rapport",

	/*
	 * env_report.jade
	 */
	generatereports : "Générer le rapport",

	/*
	 * environment_variables.jade
	 */
	environmentvariablesused : "Les variables d'environnement utilisées par",
	ibm : "IBM",
	r : "®",
	campaignlistener : "Campaign Listener",
	canbeviewedmodifiedadded : "Peut être visualisé, modifié and ajouté depuis cette page.",
	anychangesapplied : "Tout changement appliqué sera réinitialisé quand",
	isrestarted : "En redémarage.",
	tooltipgreen: "L'application est en cours d'exécution.",
	tooltipred: "Demande est en baisse.",
	tooltiporange: "Vérification...",

        /*
	 * about.jade
	 */
         about_cleargoals: "Cleargoals",
         about_product: "Maestro",
         about_version: "Version : ",
         about_copyright: " Droit d'auteur 2016 Cleargoals Inc. Tous droits réservés.",
         about_statement_a: "CLEARGOALS est une marque de CLEARGOALS Société .",
         about_statement_b: "IBM campaign , IBM Cognos , IBM WebSphere et tous les autres produits IBM figurant au sein de cette interface sont des marques d'International Business Machines Corporation aux États-Unis , d'autres pays ou les deux, et les droits d'auteur sont également appliqués dans le cas échéant .",



	/*
	 * recompute.html
	 */
	refreshedatabase : "Rafraichir la données sauvegardée dans le catalogue ou l'organigramme.",
	filetype : "Type de fichier",
	file : "Fichier",
	allcatalogfiles : "Catalogues Bibliothèque",
	filecatalog : "Fichier de Catalogue",
	fileflowchart : "Fichier de Campagne Catalogue",
	filesession : "Fichier de Catalogue Session",
	recordvalues : "Valeurs sauvegardées",
	recordcounts : "Compteur de sauvegarde",
	distinctvalues : "Valeurs distincte uniquement",
	lastrecomputed : "Last recomputed all catalogs:",
	never : "Jamais",
	showlastlog : "Afficher le dernier historique",
	nodata : "Aucune donnée",
	recomputetables : "Régénérer",

	/*
	 * reports.jade
	 */
	reports : "Rapports",
	report : "Rapport",
	reportgeneration : "Rapport de génération",
	getflowchartdata : "Télécharger les données d'organigramme",
	cell : "Cellule",
	reporttype : "Type de rapport",
	profile : "Profil",
	crosstab : "Croisé",
	samplecontent : "Exemple de contenu",
	field : "Champ(s)",
	age : "Age",
	city : "Ville",
	salary : "Salaire",
	hholdid : "HHold_ID",
	household : "BASE_HOUSEHOLD.HHOLD_ID",
	numberofbins : "Nombre de données",
	includemeta : "Inclure les metadonnées",
	numberofrecords : "Nombre d'entrées",
	skipduplicate : "Ne pas inclure les doublons",
	reportchartstable : "Rapporter les données ici",
	defaultlabel:"défaut",

	/*
	 * run.jade
	 */
	run : "Lancer",
	flowchartfile : "Fichier d'organigramme",
	platformusername : "Platform username",
	synchronousrun : "Lancement synchronisé",
	multipleflowcharts : "Multiple organigrammes",
	catalogfile : "Catalogue de fichier",
	xmlfile : "Fichier XML",
	newlogfile : "Nouveau fichier d'historique",
	addvariable : "Ajouter une variable",
	runflowchart:"Lancer le graphe",

	/*
	 * send_email.jade
	 */
	to : "À",
	group : "Groupe",
	add : "Ajouter",
	subject : "Sujet",
	body : "Corps",
	predefined : "Prédéfinir",
	custom : "Personnaliser",
	emailsbygroup:"Emails par groupe",
	customemail:"Email personnalisée",
	addallknownemails:"Ajouter tout email connu",
	ibmenvironmentrestart : "Redémarrer l'environnement IBM",
	ibmenvironmentmaintenance : "Maintenance de l'environnement IBM",

	/*
	 * start_stop.jade
	 */
	environment : "Environnement",
	bounceenvironment : "Bounce l'environment",
	stopenvironment : "Arrêter l'environnement",
	startenvironment : "Démarrer l'environnement",
	restartenvironment : "Redémarrer l'environnement",

	/*
	 * versions.jade
	 */
	versions : "Versions",
	utilityversion : "Toutes les versions à jour des différents services et outils utilisés dans le cadre de l'application sont affichées ici.",
	systemversioninformation : "Version du système",
	databaseversioninformation : "Version de la donnée",
	infrastructureinformation : "Version sur l'infrastructure",

	/*
	 * xml_viewer.jade
	 */
	xmlviewer : "Visualiser le XML",
	path : "Chemin",
	viewxml : "Voir le XML",

	// == JAVASCRIPT ==//

	/*
	 * account.js
	 */
	unsavedchanges : "Vous avez attendant les modifications non enregistrées. Voulez-vous vraiment de s'en défaire?",
	error : 'Erreur',
	needauthenticationservice : "Un compte doit avoir soit un service d'authentification tels que LDAP ou marketing, ou être muni d'un mot de passe pour authentifier localement.",

	/*
	 * accounts.js
	 */
	addnewaccount : "Ajouter un utilisateur",
	bookmarks:'Signets',
	remove:'Supprimer',
	bookmarkname:'Nom',
	bookmarkurl:'URL',
	filesystempermissions:'Autorisations de système de fichiers',
	orderrandking:'Ordre de Classement',
	canarchive:'Pouvez Archiver',
	candownload:'Pouvez Télécharger',
	canupload:'Pouvez Envoyer un Fichier',
	candelete:'Pouvez Supprimer',
	propagate:'Propager aux sous-dossiers',

	/*
	 * change_ownership.js
	 */
	changedownership : 'Avec succès changé de propriétaire',

	/*
	 * JSONBrowser.js
	 */
	//authenticationservice:'Service de Authentification', 
	authenticationservice:shortName('Service de Authentification','Authentification'), 
	password:'Mot de Passe',
	email:'Email',
	status:'Status',
	note:'Note',
	language:'Langue',
	first:'Prenom',
	middle:'Alias',
	last:'Nom',
	office:'Bureau',
	mobile:'Cellulaire',
	username:'Nom utilisateur',
	groups:'Groupes',
	permissions:'Permissions',  
	//chooseanitemtoadd:'Choisir un élément à ajouter', 
	chooseanitemtoadd:shortName('Choisir un élément à ajouter','Choisir un élément'),  
	youmustprovide:'Vous devez fournir ',
	alreadyexists:' existe déjà. ',
	hastobeunique:' doit être unique.',
	duplicate:'Double',
	unresolvederror:'Erreurs Non Résolus',
	inputerrors:"Vous avez des erreurs dans vos données d'entrée. Se il vous plaît corriger.",
	willdelete: ' sera supprimé et cette action ne peut être annulée. Voulez-vous procceed?',
	filterresults: 'Tapez pour filtrer les résultats',
	name:'Nom',
	phone:'Telephone',
	ibmmarketing:'Marketing IBM',
	groupspermissions:'Groupes & Permissions',
	//viewablefiletypes:'Types de fichiers variables',
	viewablefiletypes:('Types de fichiers variables','Types de fichiers'),
	users:'Utilisateurs',
	newgroup:'Nouvelle Groupe',
	cancel:'Annuler',
	save:'Sauvegarder',
	deleteitem:'Supprimer',

	/*
	 * clean.js
	 */
	cleanuputility : "Etes-vous sûr que vous voulez exécuter l'utilitaire campagne de nettoyage IBM (de acclean) avec les paramètres suivants? <br><br>",
	cleanuputilitynoflowchartsessions : "Pour exécuter l'utilitaire de nettoyage IBM Campaign (de acclean), aucun Sessions Organigramme ou l'utilisateur doit être en cours d'exécution et de la campagne IBM Listener doivent être en panne.",
	areyousure : 'Êtes-vous sûr?',
	campaigncurrentlyrunning: " IBM Campaign Organigramme session (s) sont en cours d'exécution.<br>",
	currentlyconnected: '  utilisateur (s) êtes actuellement connecté IBM Campaign.<br>',
	listenerrunning: 'The IBM Campaign Listener est en marche.<br>',
	stepsclean: "</span><br>S'il vous plaît suivez ces étapes: <br>(1) Arrêter ou Suspendre tous les organigrammes de fonctionnement <br>(2) Demandez à tous les utilisateurs de se déconnecter, ou de tuer leurs sessions (non recommandé) <br>(3) Arrêtez IBM Campaign Listener.",
	shutdowncampaign: 'Arrêtez Campaign Listener',
	consolenotice: "Cette console peut être utilisé pour exécuter des commandes contre la <strong>unica_svradm</strong> utilitaire<br><br>",
	availablecommands: 'Les commandes disponibles:',
	yes: 'Oui',
	cancel: 'Annuler',
	changevalue1: 'Etes-vous sûr que vous voulez changer la valeur de cette variable (<strong>',
	changevalue2: '</strong>)? <br><br>La modification de ces variables peut avoir un impact en temps réel sur la façon dont la campagne IBM est en marche et pourrait avoir une incidence sur les activités en cours au sein de la campagne IBM.',
	successfullysentemail: 'Email envoyé avec succès',
	successfullychangedpassword: 'Réussi à changer le mot de passe',
	acceptedssl1: "Assurez-vous que vous avez accepté le <a href='",
	acceptedssl2: "' target='_blank'>SSL</a>. <br>",
	acceptedssl3: "Vérifiez votre connexion à Internet. <br>",
	acceptedssl4: "Il est également possible que le serveur est en panne.",
	sessionexpired: 'Votre précédente session a expiré.',
	notauthorized: 'Non autorisé',
	accessdenied: 'Accès Refusé',
	notfound: 'Pas Trouvé',
	encounteredconflict: 'Conflits Rencontrés',
	campaignnotrunning: "Campagne d'écoute ne est pas en cours d'exécution",
	campaignutilityerror: 'Campagne erreur utilitaire',
	cannotconnectserver: 'Ne peut pas se connecter au serveur',

	/*
	 * session_manager.js
	 */
	refresh:"Rafraîchir",
	settings:"Parametres",

	triggername:"Titre d'événement",
	broadcastto:"Diffusé vers",
	campaigncode:"Code du Campaign",
	flowchartname:"Nom d'organigramme",
	campaigflowchart:"Code du Campaign/Nom d'organigramme",
	showingfiles:'Montrant Fichiers:',
	hostname:"Nom d'hôte",
	sslconnection:"Connection SSL",
	couldnotproceed:"Impossible de procéder avec l'action",
	wasalreadyrunning:" était déjà en cours d'exécution",
	youareabouttoshutdown:"Vous étes sur le point de vous arrêter et de redémarrer ",
	thisprocesscantaketenfifteenseconds:". Ce processus peut prendre de 10 à 15 secondes.",
	missing:" Manquant",
	searchforlog:"Chercher un fichier d'historique...",
	sending:"Envoi...",
	starttime:"L'heure de début",
	endtime:"Heure de fin",
	whenstring:"Quand",
	resultcode:"Code de résultat",

	/*
	 * jquery datatables
	 */
	datatableloadingrecords: "Chargement en cours...",
	datatableinfo:"Affichage de l'&eacute;lement _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
	datatablesortascending:": activer pour trier la colonne par ordre croissant",
	datatablesortdescending:": activer pour trier la colonne par ordre dÃ©croissant",
	datatableemptytable:"Aucune donnée disponible dans le tableau",
	datatableinfoempty:"Affichage de l'&eacute;lement 0 &agrave; 0 sur 0 &eacute;l&eacute;ments",
	datatableinfofiltered:"(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
	datatablelengthmenu:"Afficher _MENU_ &eacute;l&eacute;ments",
	datatablepaginatefirst:"Premier",
	datatablepaginatelast:"Dernier",
	datatablepaginatenext:"Suivant",
	datatablepaginateprevious:"Pr&eacute;c&eacute;dent",
	datatableprocessing:"Traitement en cours...",
	datatablesearch:"Rechercher&nbsp;:",
	datatablezerorecords:"Aucun &eacute;l&eacute;ment &agrave; afficher",

	timeuntilrestart:"Temps Jusqu'au Redémarrage",
	contactemail:"Email de Contact",
	contactphone:"Téléphone de Contact",
	subject:"Sujet",
	body:"Corps",
	startdate:"Date de Début",
	enddate:"Date de Fin",
	missingemailclientconfig:"FRENCH Missing Email Client configuration",
	ibmemmenvironmentrestart:"FRENCH IBM EMM Environment will be restarted in [time until restart]",
	ibmemmenvironmentrestartmessage:"FRENCH MESSAGE<br>The IBM EMM environment will be restarted in [time until restart]. Please make sure that you save any ongoing work and log off before the environment is restarted.<br><br>Current server time is [getServerDate]<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.",
	ibmemmenvironmentmaintenance:"FRENCH Scheduled IBM EMM Environment Maintenance - System will be unavailable",
	ibmemmenvironmentmaintenancemessage:"FRENCH MESSAGE <br>Please note that the IBM EMM environment will be unavailable between [start date] and [end date].<br><br>Please make sure that you save any ongoing work and log off before the system maintenance starts.<br><br>Thank you.<br><br>Contact [name] ([contact email] or [contact phone]) if you have any questions or concerns.",

	analyze:"Analyser",
	logLevel:"Niveau de Log",
	action:"Action",
	anyOption:"Faites correspondre les options ci-dessous",
	allOptions:"Rechercher tous les options ci-dessous",
	switchTheme:"Changer la Theme"
}
