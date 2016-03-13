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
	return;
}
//jQuery.noConflict();

if (!myApplication) {
	var myApplication = {};
}

myApplication.openModal = function (data, updateWindowHref = false) {
	if (Foundation) {
		if ( $('#reveal').size() == 0 ) {
			$('BODY').append('<div id="reveal" class="reveal" data-reveal></div>')
		}
		var modalData = ''+data+'',
		    m = new Foundation.Reveal($('#reveal'))
		;
		$('#reveal').html(data).foundation('open');
	} else {
		$(data).modal($modalDefaults);
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
};

myApplication.closeModal = function () {
	if (Foundation) {
		$('#reveal').foundation('close');
		$('#reveal').foundation('destroy');
	} else {
		$('.modal').modal('hide');
		$('.modal, .modal-backdrop').remove();
	}
	$('.reveal, .modal, .modal-backdrop').remove();
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
};

(function ($, doc, win) {
	
	var $doc = $(doc),
		$lang = $('HTML').attr('lang') || 'en',
		
		// datatables
		myApplication.initDatatables = function () {
			if (!$.dataTable) {
				console.warn('jQuery dataTable plug-in not found...');
				return;
			}
			$('.datatable').each(function (idx, elm) {
				var $table = $(this),
					$lang_url = {
						'de' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/German.json',
						'en' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/English.json',
						'fr' : '//cdn.datatables.net/plug-ins/1.10.9/i18n/French.json'
					},
					datatableOptions = {
						renderer : ((Foundation) ? 'foundation' : 'bootstrap'),
						language : {
							url : $lang_url[$lang]
						},
						stateSave : true,
						stateDuration : 60 * 60 * 24 * 1  // sec * min * h * d
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
					            searchable : false,
					            /*render: function ( data, type, full, meta ) {
					            	console.log(arguments, this);
					            	return "-custom-";
					            }*/
					        } ];
					        datatableOptions.columnDefs = $columnDefs;
						}
						datatableOptions.columns = $columns;
					}
				}
				
				// init table
				// console.log(datatableOptions);
				$table.dataTable(datatableOptions);
			});
		},
		
		// acl matrix/table
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
		},
	
		// (bootstrap) modals
		myApplication.initCTAXHRModals = function () {
			if (!$.modal && !Foundation.Reveal) {
				console.warn('jQuery Modal and/or Foundation Reveal plug-ins not found...');
				return;
			}
			var $body = $('BODY'),
				$modalDefaults = {
					show: true
				},
				$ajaxButtons = "A.btn[href*='add'], A.btn[href*='edit'], A.btn[href*='details'], A.btn[href*='delete']",
				$ajaxCTAOpen = "A.btn-cta-xhr.cta-xhr-modal",
				$ajaxCTAClose = ".modal-content .btn-cta-xhr-close, .modal-content .alert, .modal-content .close, .modal-content .cta-xhr-modal-close",
				$ajaxForms = ".modal-content .form-xhr"
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
						/*
						if (Foundation) {
							if ( $('#reveal').size() == 0 ) {
								$('BODY').append('<div id="reveal" class="reveal" data-reveal></div>')
							}
							var modalData = ''+data+'',
							    m = new Foundation.Reveal($('#reveal'))
							;
							$('#reveal').html(data).foundation('open');
						} else {
							$(data).modal($modalDefaults);
						}
						
						document._old_href = window.location.href;
					    window.history.pushState(
				            {
				                "html" : null,
				                "pageTitle" : document.title
				            },
				            "",
				            $btnUrl
					    );
						*/
						if ($.dataTable) {
							//$('#'+$actioncontext).dataTable().api().ajax.reload(function ( tabledata ) {
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
						/*
					    window.history.pushState(
				            {
				                "html" : null,
				                "pageTitle" : document.title
				            },
				            "",
				            formURL
					    );
						if (!document._old_href) {
							document._old_href = formURL;
						}
						$('.modal').modal('hide');
						$(data).modal($modalDefaults);
						*/
						
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
	
			/*$body.on('hidden.bs.modal', '.modal', {}, function (oEvent) {
			});*/
			
		}
	;
		
	$doc.ready(function () {
		try {
			myApplication.initDatatables();
		} catch (ex) {}
		try {
			myApplication.initCTAXHRModals();
		} catch (ex) {}
		try {
			myApplication.initCTAXHRAclMatrix();
		} catch (ex) {}
	});

})(jQuery, document, window);
