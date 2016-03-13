/**
 * BB's Zend Framework 2 Components
 * 
 * myApplication client (init-)script
 *   
 * @package		[MyApplication]
 * @package		BB's Zend Framework 2 Components
 * @package		myApplication client script
 * @author		Björn Bartels <development@bjoernbartels.earth>
 * @link		https://gitlab.bjoernbartels.earth/groups/themes
 * @license		http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
 * @copyright	copyright (c) 2016 Björn Bartels <development@bjoernbartels.earth>
 */
if (!jQuery) {
	console.error('jQuery not found...');
	window.stop();
}
//jQuery.noConflict();

/** @var  object  myApplication  global myApplication namespace */
if (!myApplication) {
	var myApplication = {};
}

/** @var  object  myApplication.Config  myApplication global configuration container */
if (!myApplication.Config) {
	myApplication.Config = {
		// detect UI framework
		renderer : ((typeof Foundation != 'undefined') ? 'foundation' : 'bootstrap'),
		// detect language
		lang : $('HTML').attr('lang') || 'en',
		
		// XHR selectors
		xhrSelectors : {
			xhrButtons  : "A.btn[href*='add'], A.btn[href*='edit'], A.btn[href*='details'], A.btn[href*='delete']",
			xhrCTAOpen  : "A.btn-cta-xhr.cta-xhr-modal",
			xhrCTAClose : ".modal-content .btn-cta-xhr-close, .modal-content .alert, .modal-content .close, .modal-content .cta-xhr-modal-close",
			xhrForms    : ".modal-content .form-xhr"
		},
		
		// modal settings
		modals : {
			bootstrapElementClassname  : 'modal',
			foundationElementClassname : 'reveal'
		},
		
		// dataTable plug-in settings
		dataTable : {
			langURLs : {
			    'en' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/English.json',
				'de' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/German.json',
				'fr' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/French.json',
				'es' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/Spanish.json',
				'it' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/Italian.json'
			},
			stateSave : true,
			stateDuration : 60 * 60 * 24 * 1  // sec * min * h * d
		},
		
	};
}


(function ($, doc, win, myApplication) {
	
	var $doc = $(doc),
		$lang = myApplication.Config.lang
	;
		
	/**
	 * init jQuery dataTable plug-in
	 * 
	 * @return myApplication
	 */
	myApplication.initDatatables = function () {
		if (!$.fn.dataTable) {
			console.warn('jQuery dataTable plug-in not found...');
			return;
		}
		$('.datatable').each(function (idx, elm) {
			var $table = $(this),
				$lang_url = myApplication.Config.dataTable.langURLs[myApplication.Config.lang],
				datatableOptions = {
					renderer : ((typeof Foundation != 'undefined') ? 'foundation' : 'bootstrap'),
					language : {
						url : $lang_url
					},
					stateSave : myApplication.Config.dataTable.stateSave,
					stateDuration : myApplication.Config.dataTable.stateDuration  // sec * min * h * d
				}
			;
			
			// has data source and is 'CRUD' table?
			var $src = $($table).data("src");
			if ( $src && $($table).hasClass('crud') ) {
				// set ajax options
				datatableOptions.ajax = {
					url : $src,
					type : "POST"
				};
				// set (data) columns, read from TH's 'data-column' attribute
				var $columns = false;
				$table.find('THEAD TH').each(function () {
					var columnname = $(this).data("column");
					if (columnname) {
						if (!$columns) { $columns = []; }
						$columns.push({
							data : columnname
						});
					}
				});
				if ($columns) {
					// action columns
					if ($table.find('THEAD TH.actions').size() > 0) {
						$columns.push(null);
				        $columnDefs = [ {
				            targets : -1,
				            data : "_actions_",
				            sortable : false,
				            searchable : false
				        } ];
				        datatableOptions.columnDefs = $columnDefs;
					}
					datatableOptions.columns = $columns;
				}
			}
			
			$table.dataTable(datatableOptions);
		});
		
		return (this);
	};
	
	/**
	 * init acl matrix/table ajax triggers
	 * 
	 * @return myApplication
	 */
	myApplication.initCTAXHRAclMatrix = function () {
		$('.datatable.matrix').each(function (idx, elm) {
			var $table = $(this),
				$switches = $table.find('FORM.allow, FORM.deny')
			;
			
			$switches.each(function (idx, elm) {
				var $switchform = $(this)
				;
				$switchform.on('submit', function (oEvent) {
					var $form = $(this),
						formURL = $form.attr('action'),
						formData = $form.serializeArray(),
						$td = $form.parent()
					;
					$.ajax({
						headers : {
							'Accept' : 'text/html',
							'X-layout' : 'modal'
						},
						type	: "POST",
						cache	: false,
						url		: formURL,
						data	: formData,
						success	: function (data) {
							
							$td.find('> FORM.allow > INPUT[type=submit], > FORM.deny > INPUT[type=submit]').each(function (idx, elm) {
								var $formsubmitter = $(this);
								if ( $formsubmitter.attr('disabled') == 'disabled' ) {
									$formsubmitter.attr('disabled', false);
								} else {
									$formsubmitter.attr('disabled', 'disabled');
								}
							});
							
						}
					});
					
					oEvent.preventDefault();
					oEvent.stopPropagation();
					return (false);
				});
			});
		});
		
		return (this);
	};

	/**
	 * open modal dialog
	 * 
	 * @param  mixed  data  the modal content
	 * @param  string  updateWindowHref  URL to update browser history and location, -false/null- disables, default -false- 
	 * @return jQuery
	 */
	myApplication.openModal = function (data, updateWindowHref) {
		if ((typeof $.fn.modal == 'undefined') && (typeof Foundation.Reveal == 'undefined')) {
			console.warn('Bootstrap Modal and/or Foundation Reveal plug-ins not found...');
			return;
		}
		var $modal = null;
		if (typeof Foundation != 'undefined') {
			if ( $('#'+myApplication.Config.modals.foundationElementClassname).size() == 0 ) {
				$('BODY').append('<div id="'+myApplication.Config.modals.foundationElementClassname+'" class="'+myApplication.Config.modals.foundationElementClassname+'" data-reveal></div>')
			}
			var modalData = ''+data+'',
			    m = new Foundation.Reveal($('#'+myApplication.Config.modals.foundationElementClassname))
			;
			$('#'+myApplication.Config.modals.foundationElementClassname).html(data).foundation('open');
			$modal = $('.'+myApplication.Config.modals.foundationElementClassname);
		} else {
			$modalDefaults = {
				show: true
			};
			$(data).modal($modalDefaults);
			$modal = $('.'+myApplication.Config.modals.bootstrapElementClassname);
		}
		
		if (updateWindowHref) {
			document._old_href = window.location.href;
		    window.history.pushState(
		        {
		            "html" : null,
		            "pageTitle" : document.title
		        },
		        "",
		        updateWindowHref
		    );
		}
		
		return ($modal);
	};
	
	/**
	 * close modal dialog
	 * 
	 * @return myApplication
	 */
	myApplication.closeModal = function () {
		if ((typeof $.fn.modal == 'undefined') && (typeof Foundation.Reveal == 'undefined')) {
			console.warn('jQuery Modal and/or Foundation Reveal plug-ins not found...');
			return;
		}
		
		// close/destroy modals
		if (typeof Foundation != 'undefined') {
			$modal = $('.'+myApplication.Config.modals.foundationElementClassname)
			$modal.foundation('close');
			$modal.foundation('destroy');
		} else {
			$modal = $('.'+myApplication.Config.modals.bootstrapElementClassname)
			$modal.modal('hide');
		}
		
		// clean up
		$('BODY').removeClass('is-reveal-open');
		$('.reveal, .modal, .modal-backdrop').remove();
		
		// (re)set document URL
		if (document._old_href) {
		    window.history.pushState(
	            {
	                "html":null,
	                "pageTitle":document.title
	            },
	            "",
	            document._old_href
		    );
		    document._old_href = null;
		}
		
		return (this);
	};

	/**
	 * init modal (click) triggers
	 * 
	 * @return myApplication
	 */
	myApplication.initCTAXHRModals = function () {
		
		if ((typeof $.fn.modal == 'undefined') && (typeof Foundation.Reveal == 'undefined')) {
			console.warn('jQuery Modal and/or Foundation Reveal plug-ins not found...');
			return;
		}
		var $body = $('BODY'),
			$ajaxButtons  = myApplication.Config.xhrSelectors.xhrButtons, // "A.btn[href*='add'], A.btn[href*='edit'], A.btn[href*='details'], A.btn[href*='delete']",
			$ajaxCTAOpen  = myApplication.Config.xhrSelectors.xhrCTAOpen, // "A.btn-cta-xhr.cta-xhr-modal",
			$ajaxCTAClose = myApplication.Config.xhrSelectors.xhrCTAClose, // ".modal-content .btn-cta-xhr-close, .modal-content .alert, .modal-content .close, .modal-content .cta-xhr-modal-close",
			$ajaxForms    = myApplication.Config.xhrSelectors.xhrForms // ".modal-content .form-xhr"
		;
		
		//
		// modal triggers
		//
		$body.on('click', $ajaxCTAOpen, {}, function (oEvent) {
			var $this = $(this),
				$actioncontext = $.data($this, "actioncontext")
				$btnUrl = $this.attr('href');
			
			$.ajax({
				headers : {
					'Accept' : 'text/html',
					'X-layout' : 'modal'
				},
				type	: "GET",
				cache	: false,
				url		: $this.attr('href'),
				success	: function (data) {
					
					myApplication.openModal(data, $btnUrl);

					if ($.dataTable) {
						$('.datatable').dataTable().api().ajax.reload(function ( tabledata ) {
							// console.log( tabledata );
						}, true);
					}
					
				}
			});
			
			oEvent.preventDefault();
			oEvent.stopPropagation();
			return (false);
			
		}); 
	
		//
		// modal forms
		//
		$body.on('submit', $ajaxForms, {}, function (oEvent) {
			var $form = $(this),
				formURL = $form.attr('action'),
				formData = $form.serializeArray()
			;
			
			formData.push( 
				($form.find('INPUT[name=del].btn').size() > 0) ? {name: 'del', value: 'delete'} : null 
			);
			
			$.ajax({
				headers : {
					'Accept' : 'text/html',
					'X-layout' : 'modal'
				},
				type	: "POST",
				cache	: false,
				url		: formURL,
				data	: formData,
				success	: function (data) {

					myApplication.closeModal();
					myApplication.openModal(data, $formURL);
					
					if ($.dataTable) {
						$('.datatable').dataTable().api().ajax.reload(function ( tabledata ) {
							// console.log( tabledata );
						}, true);
					}
					
				}
			});
			
			oEvent.preventDefault();
			oEvent.stopPropagation();
			return (false);
		});

		//
		// modal close
		//
		$body.on('click', $ajaxCTAClose, {}, function (oEvent) {
			myApplication.closeModal();
			
			oEvent.preventDefault();
			oEvent.stopPropagation();
			return (false);
		});
		
		return (this);
	};
	
	//
	// init application components
	//
	$doc.ready(function () {
		try {
			if (myApplication.initCTAXHRModals) { myApplication.initCTAXHRModals(); }
		} catch (ex) {}
		
		try {
			if (myApplication.initDatatables) { myApplication.initDatatables(); }
		} catch (ex) {}
		
		try {
			if (myApplication.initCTAXHRAclMatrix) { myApplication.initCTAXHRAclMatrix(); }
		} catch (ex) {}
	});

})(jQuery, document, window, myApplication);
