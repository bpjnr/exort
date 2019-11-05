(function ( $ ) {

	$.fn.uploader = function(options) {
        
        // Helper
		var helper = {
			get_random_integer: function(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min
            },
            bytes_to_size: function(bytes) {
				var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
				if (bytes == 0) return '0 Byte'
				var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
				return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
			}
		}

		var delay = (function() {
            var timer = 0;
            return function(callback, ms) {
                clearTimeout(timer)
                timer = setTimeout(callback, ms)
            }
        })()

		// Setup ajax progress
		var originalXhr = $.ajaxSettings.xhr
		$.ajaxSetup({
			progress: $.noop,
			xhr: function() {
				var xhr = originalXhr(), that = this
				xhr.upload.addEventListener("progress", function(evt) {
					if (that.progress !== undefined) {
						that.progress(evt)
					}
				}, false)
				return xhr
			}
		})

		var el = $(this)
        var rand = helper.get_random_integer(1, 1999199919991)
		var config = $.extend({
			// Uploader
			upload_url: '',
			input_name: '',
			auto_upload: true,
			maximum_total_files: null,
			maximum_file_size: null,
			file_types_allowed: null,

			// File picker
			file_picker_url: '',
			files_per_page: 24,

			// Event
			on_error: function(err) {},
			on_before_upload: function() {},
			on_after_upload: function() {}
	    }, options)

	    // Uploader
		var uploader = {
			input_file: 'uploaderfile-' + rand, // Input file
			input_text: 'uploadertext-' + rand, // Input text
			wrapper: 'uploaderwrapper-' + rand, // Uploader wrapper
			temporary_files: [], // Temporary array to save files if autoupload is disabled

			// Generate uploader elements
			generate_elements: function() {
				$(el).parent().append('<input type="file" id="' + uploader.input_file + '" style="display: none;" multiple>')
	    	    $(el).parent().append('<input type="text" name="' + config.input_name + '" id="' + uploader.input_text + '" value="[]" style="display: none;">')
	    	    $(el).parent().append('<div class="uploaderwrapper" id="' + uploader.wrapper + '"></div>')

                // Call uploader trigger
	    	    uploader.uploader_trigger()
	    	    uploader.on_change()
			},

			// Define uploader trigger
			uploader_trigger: function() {
				$(el).on('click', function() {
	    			$('#' + uploader.input_file).val('')
	    			$('#' + uploader.input_file).click()
	    		})
			},

			// Validate maximum total files
			validate_maximum_total_files : function(current_total_files, input_file_length) {
				if (config.maximum_total_files !== null) {
	            	if (current_total_files + input_file_length > config.maximum_total_files) {
	            		config.on_error({
	            			'status': 'error_maximum_total_files',
	            			'messages': 'Number of files to be uploaded is ' + config.maximum_total_files
	            		})

	            		return false
	            	} else {
	            		return true
	            	}
	            } else {
	            	return true
	            }
			},

			// Validate maximum file size
			validate_maximum_file_size : function(input_el) {
				if (config.maximum_file_size !== null) {
	            	var arr_file_name = []
	            	for (var i = 0; i < input_el.length; i++) {
	            		if (input_el[i].size > config.maximum_file_size) {
	            			arr_file_name.push(input_el[i].name)
	            		}
	            	}

            		if (arr_file_name.length > 0) {
            			config.on_error({
            				'status': 'error_maximum_file_size',
            				'messages': arr_file_name
            			})

            			return false
            		} else {
            			return true
            		}
            	} else {
            		return true
            	}
			},

			// Validate file type
			validate_file_type : function(input_el) {
				if (config.file_types_allowed !== null) {
	           		var arr_file_name = []
	           		for (var i = 0; i < input_el.length; i++) {
	           			if (config.file_types_allowed.indexOf(input_el[i].type) == -1) {
	           				arr_file_name.push(input_el[i].name)
	           			}
	           		}

	           		if (arr_file_name.length > 0) {
	           			config.on_error({
	           				'status': 'error_file_type',
	           				'messages': arr_file_name
	           			})

	           			return false
            		} else {
            			return true
            		}
            	} else {
            		return true
            	}
			},

            // Uploader box template
			uploader_template: function(file_reader, file) {
			    var template = '<div class="uploaderbox" data-file-name="' + file_reader.name + '">' +
	                    	    	'<div class="uploaderbox-image"></div>' +
	                       			'<div class="uploaderbox-text">' + file_reader.name.toLowerCase() + '</div>' +
	                       			'<div class="uploaderbox-filesize">' + helper.bytes_to_size(file_reader.size) + '</div>' +
                        			'<div class="uploaderbox-progressbar">' +
                        			    '<div class="uploaderbox-fill"></div>' +
                        			'</div>' +
                        			'<div class="uploaderbox-close">&times;</div>' +
	                       		'</div>'

	            template = $(template)

                if (file_reader.type !== undefined && ['png', 'jpg', 'jpeg'].indexOf(file_reader.type.split('/')[1]) !== -1) {
	                $(template).find('.uploaderbox-image').css({
						'background-image': 'url(' + file.target.result + ')'
	                })
				} else {
				    $(template).find('.uploaderbox-image').css({
	                    'background': 'rgb(119, 119, 119)',
						'background': '-webkit-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-o-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-moz-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': 'linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))'
	                })
				}

	            return template
	        },

	        // Event when file removed
	        on_remove: function(template) {
	        	$(template).find('.uploaderbox-close').on('click', function() {
				    // Remove array on input text
				    $(this).off()
				    var file_name = $(this).parent().attr('data-file-name')
				 	var arr = JSON.parse($('#' + uploader.input_text).val())

				 	var index = false
				 	for (var z = 0; z < arr.length; z++) {
				 		if (arr[z].file_name == file_name) {
				 		    index = z
				 		}
				    }

				 	arr.splice(index, 1)
				 	$('#' + uploader.input_text).val(JSON.stringify(arr))

				    // Remove temporary file if auto upload disabled
				    if (!config.auto_upload) {
				        var index = false
				        for (var i = 0; i < uploader.temporary_files.length; i++) {
    				    	if (uploader.temporary_files[i].file_reader.name == file_name) {
				    		    index = i
				    	    }
				        }

				        // Remove input file
				        uploader.temporary_files.splice(index, 1)
				    }

				    // Remove thumbnail
				    $(this).parent().fadeOut(function() {
				        $(this).remove()
				    })

				    // Remove sort file event
				    $(document).unbind('mousemove')
				})
	        },

	        // Ajax upload files
	        upload: function(template, file_reader, callback) {
				var form_data = new FormData();    
				form_data.append('file', file_reader);

				$.ajax({
					url: config.upload_url,
					data: form_data,
					processData: false,
					contentType: false,
					type: 'POST',
					success: function(data) {
						var data = JSON.parse(data)
						var complete = setInterval(function() {
							var progress = parseInt($(template).find('.uploaderbox-fill').width() * 100) / parseInt($(template).find('.uploaderbox-progressbar').width())
							if (progress < 100) {
								$(template).attr('data-file-name', data.file_name)
								$(template).find('.uploaderbox-fill').css('width', (progress += 1) + '%')
								$(template).find('.uploaderbox-filesize').html(Math.ceil(progress) + "%")
							} else {
								clearInterval(complete)
								$(template).find('.uploaderbox-filesize').html(helper.bytes_to_size(file_reader.size))
								$(template).find('.uploaderbox-progressbar').fadeOut()

								// Call success callback
								callback(data)
							}
						}, 100)
					},
					progress: function(evt) {
						if (evt.lengthComputable) {
							$(template).find('.uploaderbox-filesize').html((parseInt((evt.loaded / evt.total) * 100, 10) - 30) + "%")
							$(template).find('.uploaderbox-fill').css('width', (parseInt((evt.loaded / evt.total) * 100, 10) - 30) + "%")
						} else {
							console.log("Length not computable.");
						}
					}
				})
	        },

			// Event when input file changed
			on_change: function() {
				$('#' + uploader.input_file).change(function() {
            	    var input_el = $('#' + uploader.input_file)[0].files
            	    var input_text = $('#' + uploader.input_text).val()

            	    // File validation
            	    var validate_maximum_total_files = uploader.validate_maximum_total_files($('#' + uploader.wrapper).find('.uploaderbox').length, input_el.length)
            	    var validate_maximum_file_size = uploader.validate_maximum_file_size(input_el)
            	    var validate_file_type = uploader.validate_file_type(input_el)

	                if (validate_maximum_total_files && validate_maximum_file_size && validate_file_type) {

	                	// On before upload event for auto upload
	                	if (config.auto_upload) {
	                		config.on_before_upload()
	                	}

	                	for (var i = 0; i < input_el.length; i++) {
		            		var reader = new FileReader()
	    	                reader.onload = function (file_reader, i) {
	        	                return function (e) {
	                	            var template = uploader.uploader_template(file_reader, e)

	                	            // On remove file event
	                	            uploader.on_remove(template)

	                	            // Append files
	                	            $('#' + uploader.wrapper).append(template)

	                	            if (!config.auto_upload) {
                                        uploader.temporary_files.push({
				        					template: template,
				        					file_reader: file_reader
				        				})
	                	            } else {
	                	            	uploader.upload(template, file_reader, function(data) {
	                	            		// Save files to input text
	                	            		if ($('#' + uploader.input_text).val() !== '') {
	                	            			var arr = JSON.parse($('#' + uploader.input_text).val())
	                	            			arr.push(data)
	                	            			$('#' + uploader.input_text).val(JSON.stringify(arr))
	                	            		} else {
	                	            			$('#' + uploader.input_text).val(JSON.stringify([data]))
	                	            		}

	                	            		// Save sorted files
            								uploader.save_sort()
	                	            	})
	                	            }

	                	            // Sort files
									uploader.sort_files()
	                	        }
	                	    } (input_el[i], i)
	                    	reader.readAsDataURL(input_el[i])
	                	}
	                }

	                // On success upload event
	                var last_upload = false
	                $(document).off()
		            $(document).ajaxStop(function() {
		           		if (!last_upload) {
		           			last_upload = true			
							
							setTimeout(function() {
	            				config.on_success_upload()
							}, 2000)
	            		}
					})
	            })
			},

			// Event for upload file if auto upload is disabled
            manual_upload: function(on_success_callback) {

            	// On before upload event for manual upload
            	config.on_before_upload()

            	if (uploader.temporary_files.length > 0) {
            		var success_upload = 0

            		for (var i = 0; i < uploader.temporary_files.length; i++) {
						uploader.upload(uploader.temporary_files[i].template, uploader.temporary_files[i].file_reader, function(data) {
							// Save files to input text
	   	    	         	if ($('#' + uploader.input_text).val() !== '') {
	        	        	    var arr = JSON.parse($('#' + uploader.input_text).val())
	        	        	    arr.push(data)
	        	        	    $('#' + uploader.input_text).val(JSON.stringify(arr))
	        	        	} else {
	        	        	    $('#' + uploader.input_text).val(JSON.stringify([data]))
	        	        	}

	        	        	// Save sorted files
            				uploader.save_sort()

            	            // Save success upload state 
            				success_upload++
						})
					}

					$(document).ajaxStop(function() {
						var ivl = setInterval(function() {
							if (success_upload == uploader.temporary_files.length) {
								uploader.temporary_files = []
					
						        // Call success callback
						        on_success_callback()
						        clearInterval(ivl)
							}
						}, 1000)
					})
				} else {
                    // Call success callback
			        on_success_callback()
				}
            },

            // Event for sort files
            sort_files: function() {
            	$('#' + uploader.wrapper).find(".uploaderbox").each(function() {
            		var box = this
            		var placeholder = $('<div class="uploaderbox-placeholder"><div class="uploaderbox-image"></div></div>')
            		var placeholderX, placeholderY
            		var cursorPositionX = null, cursorPositionY = null

            		$(box).off()
            		$(box).mousedown(function() {
            			$(document).mousemove(function(e) {
            				if (cursorPositionX == null, cursorPositionY == null) {
            					cursorPositionX = e.pageX - $(box).position().left
            					cursorPositionY = e.pageY - $(box).position().top
            				}

            				$(box).css({
            					'cursor': 'move',
            					'z-index': '9999999',
            					'position': 'absolute',
            					'top': e.pageY - cursorPositionY + 'px',
            					'left': e.pageX - cursorPositionX + 'px',
            					'-webkit-animation': 'initial',
            					'animation': 'initial'
            				})

            				$('#' + uploader.wrapper).find('.placeholder').remove()
            				$(box).after(placeholder)
            				placeholderY = $(placeholder).position().top
            				placeholderX = $(placeholder).position().left

            				$('#' + uploader.wrapper).find(".uploaderbox").each(function() {
            					if (this !== box) {
            						var position = $(this).position()
            						if (e.pageX - cursorPositionX >= position.left && e.pageX - cursorPositionX <= position.left + $(this).width() && e.pageY - cursorPositionY >= position.top && e.pageY - cursorPositionY <= position.top + $(this).height()) {
            							$('#' + uploader.wrapper).find('.placeholder').remove()
            							if (e.pageX - cursorPositionX >= position.left && e.pageX - cursorPositionX <= position.left + ($(this).width() * 50) / 100) {
            								$(this).before(placeholder)
            							} else if (e.pageX - cursorPositionX >= position.left + ($(this).width() * 50) / 100 && e.pageX - cursorPositionX <= position.left + $(this).width()) {
            								$(this).after(placeholder)
            							}

            							$(placeholder).before(box)

            							placeholderY = $(placeholder).position().top
            							placeholderX = $(placeholder).position().left
            						}
            					}
            				})
            			})
            		}).mouseup(function() {
            			if ($(document).find(placeholder).length == 1) {
            				$(document).unbind('mousemove')
            				$(box).animate({
            					'position': 'absolute',
            					'top': placeholderY + 'px',
            					'left': placeholderX + 'px'
            				}, 100, function() {
            					$(box).css({
            						'position': 'relative',
            						'z-index': '99999',
            						'top': 'auto',
            						'left': 'auto',
            						'cursor': 'pointer'
            					})
            					$(placeholder).replaceWith(box)

            					// Save sorted files
            					uploader.save_sort()

                            	cursorPositionX = null
                            	cursorPositionY = null
                        	})
            			}
            		})
            	})
            },

            // Save sorted files into file input
            save_sort: function() {
                var arr = JSON.parse($('#' + uploader.input_text).val())
	    	    var new_arr = []

    	    	$('#' + uploader.wrapper).find('.uploaderbox').each(function() {
	        		for (var i = 0; i < arr.length; i++) {
	        			if (arr[i].file_name == $(this).attr('data-file-name')) {
	    	    			new_arr.push(arr[i])
	    		    	}
    	    		}
	        	})

	    	    $('#' + uploader.input_text).val(JSON.stringify(new_arr))
            }
		}

		this.upload = function(on_success) {
			uploader.manual_upload(on_success)
		}

		// Filepicker
		var filepicker = {
			input_file: 'uploaderfile-' + rand, // Input file
			input_text: 'uploadertext-' + rand, // Input text
			wrapper: 'uploaderwrapper-' + rand, // Uploader wrapper
			picker: 'pickerwrapper-' + rand, // Filepicker template
			temporary_files: [], // Temporary array to save selected files

			// Filepicker template
			filepicker_template: function() {
			    var template = '<div class="pickerwrapper" id="' + filepicker.picker + '">' +
	    	                        '<div class="pickerclose">&times;</div>' +
	    	                        '<div class="pickerbox">' +
	    	                            '<div class="pickermenu">' +
	    	                                '<ul>' +
	    	                                   '<li data-menu="files" class="active">Files</li>' +
	    	                                    '<li data-menu="upload">Upload</li>' +
	    	                                '</ul>' +
	    	                            '</div>' +
	    	                            '<div class="pickermain">' +
		    	                            '<div class="pickercontent">' +
		    	                                '<div class="pickertoolbar">' +
		                                            '<input type="text" class="pickersearch" placeholder="Search files...">' +
		                                            '<div class="pickerview">' +
		  	                                            '<div class="pickericon-wrapper picker-thumbnail active" data-view="thumbnail">' +
		  	                                            	'<div class="pickericon-box">' +
			  	                                                '<div class="pickericon"></div>' +
		    	                                                '<div class="pickericon"></div>' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                        '</div>' +
		    	                                        '</div>' +
		    	                                        '<div class="pickericon-wrapper picker-grid" data-view="grid">' +
		    	                                        	'<div class="pickericon-box">' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                            '<div class="pickericon"></div>' +
			    	                                        '</div>' +
		    	                                        '</div>' +
		    	                                    '</div>' +
		    	                                    '<div class="pickerinfo"><span class="pickerselectedfiles">0</span> Files selected of ' + config.maximum_total_files + ' maximum allowed <a class="pickerclear" href="javascript:;">Clear</a></div>' +
		    	                                '</div>' +
		                                        '<div class="pickerfiles"></div>' +
		  	                                    '<div class="pickerbottom">' +
		    	                                  	'<div class="pickerpagination">' +
		    	                                   		'<ul></ul>' +
		    	                                   	'</div>' +
		    	                                   	'<div class="pickeraction">' +
			   	                                        '<button type="button" class="pickersave">Save</button>' +
			   	                                    '</div>' +
		                                        '</div>' +
		   	                                '</div>' +
		   	                                '<div class="pickerupload">' +
		    	                             	'<div class="pickerupload-alert">The file has been successfully uploaded and selected</div>' +
		    	                               	'<div class="pickerupload-left">' +
			    	                                '<div class="pickerupload-text">Use the button bellow to upload some files</div>' +
			    	                                '<button type="button" class="pickerupload-button">Choose Files</button>' +
			    	                                '<div class="pickerupload-maximum">Maximum upload file size: ' + helper.bytes_to_size(config.maximum_file_size) + '.</div>' +
			    	                           	'</div>' +
		    	                               	'<div class="pickerupload-right">' +
		    	                               		'<div class="pickerupload-notfound">No upload process</div>' +
		    	                               	'</div>' +
		    	                            '</div>' +
		    	                        '</div>' +
	                                '</div>' +
	                            '</div>'

	    		template = $(template)

	    		// Hide maximum upload label if not required
		    	if (config.maximum_file_size === null) {
		    		$(template).find('.pickerupload-maximum').hide()
		    	}

		    	// Picker search files
		    	$(template).find('.pickersearch').on('keyup', function() {
		    		delay(function() {
		        		filepicker.load_files(1)
		        	}, 1000);
		    	})

		    	// Picker menu
		    	$(template).find('.pickermenu > ul > li').on('click', function() {
		    		var menu = $(this).attr('data-menu')
		    		if (menu == 'files') {
		    			$(template).find('.pickermenu > ul > li').removeClass('active')
		    			$(this).addClass('active')
		    			$(template).find('.pickercontent').animate({
		    				marginTop: '0px'
		    			})
		    		} else {
		    			$(template).find('.pickermenu > ul > li').removeClass('active')
		    			$(this).addClass('active')
		    			$(template).find('.pickercontent').animate({
		    				marginTop: '-' + $(template).find('.pickercontent').height() + 'px'
		    			})
		    		}
		    	})

		    	// Picker view to change view to list or thumbnail
		    	$(template).find('.pickericon-wrapper').on('click', function() {
		    		var view = $(this).attr('data-view')
		    		$('.pickericon-wrapper').removeClass('active')
		    		$(this).addClass('active')
		    		$(template).find('.pickerfiles').addClass('pickerloading')

		    		setTimeout(function() {
		    			$(template).find('.pickerfiles').removeClass('pickerloading')

			    		if (view == 'thumbnail') {
			    			$(template).find('.pickerfiles').removeClass('pickerlist')
			    		} else {
			    			$(template).find('.pickerfiles').addClass('pickerlist')
			    		}
		    		}, 500)
		    	})

		    	// Picker close
		    	$(template).find('.pickerclose').on('click', function() {
		    		$(template).hide()
		    		$(template).find('.pickerfiles').html('')
		    		$(template).find('.pickerpagination > ul').html('')
		    		filepicker.temporary_files = []
		    	})

		    	// Picker save
		    	filepicker.save_filepicker(template)

	            return template
	        },

	        // Event for sort files
            sort_files: function() {
            	$('#' + filepicker.wrapper).find(".uploaderbox").each(function() {
            		var box = this
            		var placeholder = $('<div class="uploaderbox-placeholder"><div class="uploaderbox-image"></div></div>')
            		var placeholderX, placeholderY
            		var cursorPositionX = null, cursorPositionY = null

            		$(box).off()
            		$(box).mousedown(function() {
            			$(document).mousemove(function(e) {
            				if (cursorPositionX == null, cursorPositionY == null) {
            					cursorPositionX = e.pageX - $(box).position().left
            					cursorPositionY = e.pageY - $(box).position().top
            				}

            				$(box).css({
            					'cursor': 'move',
            					'z-index': '9999999',
            					'position': 'absolute',
            					'top': e.pageY - cursorPositionY + 'px',
            					'left': e.pageX - cursorPositionX + 'px',
            					'-webkit-animation': 'initial',
            					'animation': 'initial'
            				})

            				$('#' + filepicker.wrapper).find('.placeholder').remove()
            				$(box).after(placeholder)
            				placeholderY = $(placeholder).position().top
            				placeholderX = $(placeholder).position().left

            				$('#' + filepicker.wrapper).find(".uploaderbox").each(function() {
            					if (this !== box) {
            						var position = $(this).position()
            						if (e.pageX - cursorPositionX >= position.left && e.pageX - cursorPositionX <= position.left + $(this).width() && e.pageY - cursorPositionY >= position.top && e.pageY - cursorPositionY <= position.top + $(this).height()) {
            							$('#' + filepicker.wrapper).find('.placeholder').remove()
            							if (e.pageX - cursorPositionX >= position.left && e.pageX - cursorPositionX <= position.left + ($(this).width() * 50) / 100) {
            								$(this).before(placeholder)
            							} else if (e.pageX - cursorPositionX >= position.left + ($(this).width() * 50) / 100 && e.pageX - cursorPositionX <= position.left + $(this).width()) {
            								$(this).after(placeholder)
            							}

            							$(placeholder).before(box)

            							placeholderY = $(placeholder).position().top
            							placeholderX = $(placeholder).position().left
            						}
            					}
            				})
            			})
            		}).mouseup(function() {
            			if ($(document).find(placeholder).length == 1) {
            				$(document).unbind('mousemove')
            				$(box).animate({
            					'position': 'absolute',
            					'top': placeholderY + 'px',
            					'left': placeholderX + 'px'
            				}, 100, function() {
            					$(box).css({
            						'position': 'relative',
            						'z-index': '99999',
            						'top': 'auto',
            						'left': 'auto',
            						'cursor': 'pointer'
            					})
            					$(placeholder).replaceWith(box)

            					// Save sorted files
            					filepicker.save_sort()

                            	cursorPositionX = null
                            	cursorPositionY = null
                        	})
            			}
            		})
            	})
            },

            // Save sorted files into file input
            save_sort: function() {
                var arr = JSON.parse($('#' + filepicker.input_text).val())
	    	    var new_arr = []

    	    	$('#' + filepicker.wrapper).find('.uploaderbox').each(function() {
	        		for (var i = 0; i < arr.length; i++) {
	        			if (arr[i].file_name == $(this).attr('data-file-name')) {
	    	    			new_arr.push(arr[i])
	    		    	}
    	    		}
	        	})

	    	    $('#' + filepicker.input_text).val(JSON.stringify(new_arr))
            },

            // Uploader template
	        uploader_template: function(file) {
	        	var template =  '<div class="uploaderbox" data-file-name=\'' + file.file_name + '\'>' +
									'<div class="uploaderbox-image">' +
										'<div class="uploaderbox-background"></div>' +
										'<div class="uploaderbox-overlay"></div>' +
									'</div>' +
									'<div class="uploaderbox-text">' + file.file_name + '</div>' +
									'<div class="uploaderbox-filesize">' + helper.bytes_to_size(file.file_size) + '</div>' +
                					'<div class="uploaderbox-close">&times;</div>' +
						    	'</div>'

				template = $(template)

				if (file.file_thumbnail != '') {
					// Show image with lazy load
					var $temporary_image = $("<img>")
					
					$temporary_image.load(function() {
						var temp = $(this)
						setTimeout(function() {
							$(template).find('.uploaderbox-background').css({
								'background-image': 'url(' + $(temp).attr("src") + ')'
    	    				}).fadeIn('slow')
    	    				$(template).find('.uploaderbox-overlay').css('margin-top', '-100%').fadeOut('slow')
						}, 1000)
					})
					$temporary_image.attr("src", file.file_thumbnail.split(' ').join('%20'))
				} else {
					$(template).find('.uploaderbox-image').css({
        				'background': 'rgb(119, 119, 119)',
						'background': '-webkit-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-o-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-moz-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': 'linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))'
        			})
				}

				// Event when uploader file removed
				$(template).find('.uploaderbox-close').on('click', function() {
	    			$(this).off()

	    			// Find and remove file by name
	    			var file_name = $(this).parent().attr('data-file-name')
	       			var arr = JSON.parse($('#' + filepicker.input_text).val())

	       			var index = false
	       			for (var z = 0; z < arr.length; z++) {
	       				if (arr[z].file_name == file_name) {
	       					index = z
	       				}
	       			}

	       			arr.splice(index, 1)
	       			$('#' + filepicker.input_text).val(JSON.stringify(arr))

    				// Remove thumbnail
    				$(this).parent().fadeOut(function() {
    					$(this).remove()
    				})

    				// Remove sort file event
				    $(document).unbind('mousemove')
    			})

				return template
	        },

	        // Save filepicker
	        save_filepicker: function(filepicker_template) {
	        	// Picker save
		    	$(filepicker_template).find('.pickersave').on('click', function() {
		    		$(filepicker_template).hide()
		    		$(filepicker_template).find('.pickerfiles').html('')
		    		$(filepicker_template).find('.pickerpagination > ul').html('')

		    		// Save files on input text
		    		$('#' + filepicker.input_text).val(JSON.stringify(filepicker.temporary_files))
		    		$('#' + filepicker.wrapper).html('')

		    		for (var i = 0; i < filepicker.temporary_files.length; i++) {
		    			var template = filepicker.uploader_template(filepicker.temporary_files[i])
	    				$('#' + filepicker.wrapper).append(template)
					}

					// Sort files
					filepicker.sort_files()

		    		filepicker.temporary_files = []
		    	})
	        },

			// Validate filepicker upload maximum file size
			validate_upload_maximum_file_size : function(input_el) {
				if (config.maximum_file_size !== null) {
	            	var arr_file_name = []
	            	for (var i = 0; i < input_el.length; i++) {
	            		if (input_el[i].size > config.maximum_file_size) {
	            			arr_file_name.push(input_el[i].name)
	            		}
	            	}

            		if (arr_file_name.length > 0) {
            			config.on_error({
            				'status': 'error_maximum_file_size',
            				'messages': arr_file_name
            			})

            			return false
            		} else {
            			return true
            		}
            	} else {
            		return true
            	}
			},

			// Validate filepicker upload file type
			validate_upload_file_type : function(input_el) {
				if (config.file_types_allowed !== null) {
	           		var arr_file_name = []
	           		for (var i = 0; i < input_el.length; i++) {
	           			if (config.file_types_allowed.indexOf(input_el[i].type) == -1) {
	           				arr_file_name.push(input_el[i].name)
	           			}
	           		}

	           		if (arr_file_name.length > 0) {
	           			config.on_error({
	           				'status': 'error_file_type',
	           				'messages': arr_file_name
	           			})

	           			return false
            		} else {
            			return true
            		}
            	} else {
            		return true
            	}
			},

			// Filepicker upload progress template
			upload_progress_template: function(file_reader, file) {
				// Render thumbnails
	        	var template = '<div class="uploaderbox">' +
	                    	        '<div class="uploaderbox-image"></div>' +
	                       			'<div class="uploaderbox-text">' + file_reader.name.toLowerCase() + '</div>' +
	                       			'<div class="uploaderbox-filesize">' + helper.bytes_to_size(file_reader.size) + '</div>' +
                        			'<div class="uploaderbox-progressbar">' +
                        			    '<div class="uploaderbox-fill"></div>' +
                        			'</div>' +
	                       		'</div>'
	            template = $(template)

	            if (file_reader.type !== undefined && ['png', 'jpg', 'jpeg'].indexOf(file_reader.type.split('/')[1]) !== -1) {
	                $(template).find('.uploaderbox-image').css({
					    'background-image': 'url(' + file.target.result + ')'
	                })
				} else {
				    $(template).find('.uploaderbox-image').css({
	                    'background': 'rgb(119, 119, 119)',
						'background': '-webkit-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-o-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-moz-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': 'linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))'
	                })
				}

				return template
			},

			// Ajax filepicker upload files
	        upload: function(template, file_reader, callback) {
				var form_data = new FormData();    
				form_data.append('file', file_reader);

				$.ajax({
					url: config.upload_url,
					data: form_data,
					processData: false,
					contentType: false,
					type: 'POST',
					success: function(data) {
						var data = JSON.parse(data)
						
						// Call success callback
						callback(data)

						var complete = setInterval(function() {
							var progress = parseInt($(template).find('.uploaderbox-fill').width() * 100) / parseInt($(template).find('.uploaderbox-progressbar').width())
							if (progress < 100) {
								$(template).attr('data-file-name', data.file_name)
								$(template).find('.uploaderbox-fill').css('width', (progress += 1) + '%')
								$(template).find('.uploaderbox-filesize').html(Math.ceil(progress) + "%")
							} else {
								clearInterval(complete)
								$(template).find('.uploaderbox-filesize').html(helper.bytes_to_size(file_reader.size))
								$(template).find('.uploaderbox-progressbar').fadeOut()
								$(template).fadeOut().remove()
							}
						}, 100)
					},
					progress: function(evt) {
						if (evt.lengthComputable) {
							$(template).find('.uploaderbox-filesize').html((parseInt((evt.loaded / evt.total) * 100, 10) - 30) + "%")
							$(template).find('.uploaderbox-fill').css('width', (parseInt((evt.loaded / evt.total) * 100, 10) - 30) + "%")
						} else {
							console.log("Length not computable.");
						}
					}
				})
	        },

	        // Event when input file changed
			on_change: function() {
				$('#' + filepicker.input_file).change(function() {
					var input_el = $('#' + uploader.input_file)[0].files

					// File validation
					var validate_upload_maximum_file_size = filepicker.validate_upload_maximum_file_size(input_el)
    				var validate_upload_file_type = filepicker.validate_upload_file_type(input_el)

    				if (validate_upload_maximum_file_size && validate_upload_file_type) {
                        $('#' + filepicker.picker).find('.pickerupload-notfound').fadeOut()

		            	for (var i = 0; i < input_el.length; i++) {
		            		var reader = new FileReader()
	    	                reader.onload = function (file_reader, i) {
	        	                return function (e) {
	        	                	var template = filepicker.upload_progress_template(file_reader, e)
				        			$('#' + filepicker.picker).find('.pickerupload-right').prepend(template)

				        			// Upload file
					        		filepicker.upload(template, file_reader, function(data) {
					        			// Remove the first file if exceed maximum limit
					        			if (filepicker.temporary_files.length + 1 > config.maximum_total_files) {
											filepicker.temporary_files.splice(0, 1)
											filepicker.temporary_files.push(data)
										} else {
											filepicker.temporary_files.push(data)
										}

										// Enable save button if disabled
		    							$('#' + filepicker.picker).find('.pickersave').attr('disabled', false)
					        		})

	        	                }
	        	            } (input_el[i], i)
	                    	reader.readAsDataURL(input_el[i])
		            	}
    				}

    				var last_upload = false
		            $(document).ajaxStop(function() {
		           		if (!last_upload) {
		           			last_upload = true
							filepicker.load_files(1)

							setTimeout(function() {
								$('#' + filepicker.picker).find('.pickerupload-alert').animate({
				    				top: '30px'
					    		})

								setTimeout(function() {
									$('#' + filepicker.picker).find('.pickerupload-alert').animate({
					    				top: '-60px'
					    			})
								}, 5000)

								$('#' + filepicker.picker).find('.pickerupload-notfound').fadeIn()
							}, 2000)
	            		}
					})
	            })
			},

			// Define upload trigger
			upload_trigger: function() {
				// Picker upload
	    		$('#' + filepicker.picker).find('.pickerupload-button').on('click', function() {
	    			$('#' + filepicker.input_file).val('')
	    			$('#' + filepicker.input_file).click()
	    		})
			},

	        // Generate filepicker elements
			generate_elements: function() {
				$(el).parent().append('<input type="file" id="' + filepicker.input_file + '" style="display: none;" multiple>')
	    	    $(el).parent().append('<input type="text" name="' + config.input_name + '" id="' + filepicker.input_text + '" value="[]" style="display: none;">')
	    	    $(el).parent().append('<div class="uploaderwrapper" id="' + filepicker.wrapper + '"></div>')
	    	    $('body').append(filepicker.filepicker_template())

                // Call filepicker trigger
	    	    filepicker.filepicker_trigger()
	    	    filepicker.upload_trigger()
	    	    filepicker.on_change()

	    	    // Clear selected files event
	    	    filepicker.clear_selected_files()
			},

			// Validate maximum file size
			validate_maximum_file_size : function(data) {
				if (config.maximum_file_size !== null) {
					if (data.file_size > config.maximum_file_size) {
						config.on_error({
							'status': 'error_maximum_file_size',
							'messages': [ data.file_name ]
						})

						return false
					} else {
						return true
					}
				} else {
					return true
				}
			},

			// Validate file type
			validate_file_type : function(data) {
				if (config.file_types_allowed !== null) {
					if (config.file_types_allowed.indexOf(data.file_type) == -1) {
						config.on_error({
							'status': 'error_file_type',
							'messages': [ data.file_name ]
						})

						return false
					} else {
						return true
					}
				} else {
					return true
				}
			},

	        // Event when filepicker file clicked
	        on_click: function(template) {
	        	$(template).on('click', function() {
    				var data = JSON.parse($(this).attr('data-file'))

    				var validate_maximum_file_size = filepicker.validate_maximum_file_size(data)
    				var validate_file_type = filepicker.validate_file_type(data)

    				if (validate_maximum_file_size && validate_file_type) {
    					$(this).addClass('selected')
				    	$(this).find('.uploaderbox-close').show()

				    	// Check if file is not selected
				    	var found = false
		    			for (var z = 0; z < filepicker.temporary_files.length; z++) {
		    				if (filepicker.temporary_files[z].file_name == data.file_name) {
		    					found = true
		    				}
		    			}

				    	if (!found) {
				    		// Remove the first file if exceed maximum limit
		    				if (config.maximum_total_files !== null) {
		    					if (filepicker.temporary_files.length + 1 > config.maximum_total_files) {
		    						var first_file_name = filepicker.temporary_files[0].file_name
		    						filepicker.temporary_files.splice(0, 1)

		    						$('#' + filepicker.picker).find('.pickerfiles').find('.uploaderbox').each(function() {
		    							var file_name = JSON.parse($(this).attr('data-file')).file_name
		    							if (first_file_name == file_name) {
		    								$(this).removeClass('selected')
		    								$(this).find('.uploaderbox-close').hide()
		    							}
		    						})
		    					}
		    				}

				        	filepicker.temporary_files.push(data)

				        	// Enable save button if disabled
		    				$('#' + filepicker.picker).find('.pickersave').attr('disabled', false)

				        	// Set selected files info
				        	$('#' + filepicker.picker).find('.pickerselectedfiles').html(filepicker.temporary_files.length)
				            $('#' + filepicker.picker).find('.pickerclear').show()
				    	}
					}
    			})
	        },

	        // Event when filepicker file removed
	        on_remove: function(template) {
	        	$(template).find('.uploaderbox-close').on('click', function(e) {
     				$(this).parent().removeClass('selected')
				    $(this).hide()

				    // Remove selected file
    				var data = JSON.parse($(this).parent().attr('data-file'))
				    for (var i = 0; i < filepicker.temporary_files.length; i++) {
				    	if (filepicker.temporary_files[i].file_name == data.file_name) {
				    		filepicker.temporary_files.splice(i, 1)
				    	}
				    }

				    // Disable save button if no files selected
		    		if (filepicker.temporary_files.length == 0) {
		    			$('#' + filepicker.picker).find('.pickersave').attr('disabled', true)
		    		}

				    // Set selected files info
				    $('#' + filepicker.picker).find('.pickerselectedfiles').html(filepicker.temporary_files.length)

				    // Show or hide clear selected files
					filepicker.temporary_files.length > 0 ? $('#' + filepicker.picker).find('.pickerclear').show() : ''

     				e.stopPropagation()
    			})
	        },

	        // Filepicker pagination
	        pagination: function(data, page) {
        	 	var total_page = Math.ceil(data.total / config.files_per_page)
				
				// Reset pagination
				$('#' + filepicker.picker).find('.pickerpagination > ul').html('')

				// First
	    		var first_template = $('<li>First</li>')
	    		if (page > 1) {
	    			$(first_template).on('click', function() { filepicker.load_files(1) })
	    		}
	    		$('#' + filepicker.picker).find('.pickerpagination > ul').append(first_template)

	    		// Prev
	    		var prev_template = $('<li>Prev</li>')
	    		if (page > 1) {
	    			$(prev_template).on('click', function() { filepicker.load_files(page - 1) })
	    		}
	    		$('#' + filepicker.picker).find('.pickerpagination > ul').append(prev_template)

	    		// Page before
	    		var start
	    		if (page - 3 <= 0) {
	    			start = 1
		    	} else {
		    		var append = 0
		    		if (page + 3 > total_page) {
		    			var margin = (page + 3) - total_page
		    			if (page - 3 - margin > 0) {
		    				append = margin
		    			} else {
		    				append = (page - 1) - 3
		    			}
		    		} else {
		    			append = 0
		    		}

		    		start = page - 3 - append
		    	}

				for (var i = start; i < page; i++) {
					var page_template = $('<li data-page="' + i + '">' + i + '</li>')
					$(page_template).on('click', function() { 
						filepicker.load_files($(this).attr('data-page'))
					})
					$('#' + filepicker.picker).find('.pickerpagination > ul').append(page_template)
				}

				// Current page
				$('#' + filepicker.picker).find('.pickerpagination > ul').append('<li class="active">' + page + '</li>')

				// Page after
	    		var end
	    		if (page + 3 > total_page) {
	    			end = total_page
		    	} else {
		    		var append = 0
		    		if (page - 3 <= 0) {
		    			var margin = 3 - (page - 1)
		    			if (page + 3 + margin > total_page) {
		    				append = total_page - page - 3
		    			} else {
		    				append = margin
		    			}
		    		} else {
		    			append = 0
		    		}

		    		end = page + 3 + append
		    	}

				for (var i = page + 1; i <= end; i++) {
					var page_template = $('<li data-page="' + i + '">' + i + '</li>')
					$(page_template).on('click', function() {
						filepicker.load_files($(this).attr('data-page'))
					})
					$('#' + filepicker.picker).find('.pickerpagination > ul').append(page_template)
				}

	    		// Next
	    		var next_template = $('<li>Next</li>')
	    		if (page < total_page) {
	    			$(next_template).on('click', function() { filepicker.load_files(page + 1) })
	    		}
	    		$('#' + filepicker.picker).find('.pickerpagination > ul').append(next_template)

	    		// Last
	    		var last_template = $('<li>Last</li>')
	    		if (page < total_page) {
	    			$(last_template).on('click', function() { filepicker.load_files(total_page) })
	    		}
	    		$('#' + filepicker.picker).find('.pickerpagination > ul').append(last_template)
	        },

	        // Clear selected files
	        clear_selected_files: function() {
	        	$('#' + filepicker.picker).find('.pickerclear').hide()
		    	$('#' + filepicker.picker).find('.pickerclear').on('click', function() {
		    		filepicker.temporary_files = []

		    		// Set selected files info
				    $('#' + filepicker.picker).find('.pickerselectedfiles').html(filepicker.temporary_files.length)
		    	    $('#' + filepicker.picker).find('.pickerclear').hide()

		    		$('#' + filepicker.picker).find('.pickerfiles').find('.uploaderbox').each(function() {
		    			$(this).removeClass('selected')
		    			$(this).find('.uploaderbox-close').hide()
		    		})
		    	})
	        },

	        // Filepicker uploader box template
			filepicker_box_template: function(file) {
				// Check if file is selected
				var selected = false
    			for (var z = 0; z < filepicker.temporary_files.length; z++) {
    				if (filepicker.temporary_files[z].file_name == file.file_name) {
    					selected = true
    				}
    			}

    			var selected_class = selected ? 'selected' : ''
    			var template =  '<div class="uploaderbox ' + selected_class + '" data-file=\'' + JSON.stringify(file) + '\'>' +
									'<div class="uploaderbox-image">' +
										'<div class="uploaderbox-background"></div>' +
										'<div class="uploaderbox-overlay"></div>' +
									'</div>' +
									'<div class="uploaderbox-text">' +
										'<div class="uploaderbox-textfill">' + file.file_name + '</div>' +
									'</div>' +
									'<div class="uploaderbox-filesize">' + helper.bytes_to_size(file.file_size) + '</div>' +
                					'<div class="uploaderbox-close">&times;</div>' +
							    '</div>'
				template = $(template)

				// Hide close button if file is selected
				!selected ? $(template).find('.uploaderbox-close').hide() : ''

				if (file.file_thumbnail != '') {
					// Show image with lazy load
					var $temporary_image = $("<img>")

					$temporary_image.load(function() {
						var temp = $(this)
						setTimeout(function() {
							$(template).find('.uploaderbox-background').css({
								'background-image': 'url(' + $(temp).attr("src") + ')'
    	    				}).fadeIn('slow')
    	    				$(template).find('.uploaderbox-overlay').css('margin-top', '-100%').fadeOut('slow')
						}, 1000)
					})
					$temporary_image.attr("src", file.file_thumbnail.split(' ').join('%20'))
				} else {
					$(template).find('.uploaderbox-image').css({
						'background': 'rgb(119, 119, 119)',
						'background': '-webkit-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-o-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': '-moz-linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))',
						'background': 'linear-gradient(rgb(119, 119, 119), rgb(0, 0, 0))'
					})
					$(template).find('.uploaderbox-overlay').hide()
				}

				return template
	        },

			// Load filepicker files
			load_files: function(page) {
				page = parseInt(page)
		    	$('#' + filepicker.picker).find('.pickerfiles').scrollTop(0)
		    	$('#' + filepicker.picker).find('.pickerfiles').addClass('pickerloading')

		    	$.get(config.file_picker_url, {
		    		page: page, 
		    		files_per_page: config.files_per_page,
		    		search_file: $('#' + filepicker.picker).find('.pickersearch').val()
		    	}).done(function(data) {
		    		var data = JSON.parse(data)
	    			$('#' + filepicker.picker).find('.pickerfiles').removeClass('pickerloading').html('')

		    		for (var i = 0; i < data.files.length; i++) {
		    			var template = filepicker.filepicker_box_template(data.files[i])

		    			// On click event
		    			filepicker.on_click(template)

		    			// On remove event
		    			filepicker.on_remove(template)

		    			$('#' + filepicker.picker).find('.pickerfiles').append(template)
		    		}

					// Set selected files info
					$('#' + filepicker.picker).find('.pickerselectedfiles').html(filepicker.temporary_files.length)

					// Show or hide clear selected files
					filepicker.temporary_files.length > 0 ? $('#' + filepicker.picker).find('.pickerclear').show() : ''

					// Render pagination
					filepicker.pagination(data, page)
		    	})
			},

			// Define filepicker trigger
			filepicker_trigger: function() {
				$(el).on('click', function() {
					// Save selected files state
	    			filepicker.temporary_files = JSON.parse($('#' + filepicker.input_text).val())

	    			// Disable save button if no files selected
		    		if (filepicker.temporary_files.length == 0) {
		    			$('#' + filepicker.picker).find('.pickersave').attr('disabled', true)
		    		} else {
		    			$('#' + filepicker.picker).find('.pickersave').attr('disabled', false)
		    		}

	    			// Show filepicker
		    		$('#' + filepicker.picker).show()
		    		filepicker.load_files(1)
	    		})
			}
		}

		if (config.file_picker_url == '') {
			uploader.generate_elements()
		} else {
			filepicker.generate_elements()
		}

		// Set files
		this.set_files = function(json) {
			var arr = JSON.parse(json)
			var main_class = config.file_picker_url == '' ? uploader : filepicker
			$('#' + filepicker.input_text).val(JSON.stringify(arr))

			for (var i = 0; i < arr.length; i++) {
				var template = filepicker.uploader_template(arr[i])
    			$('#' + main_class.wrapper).append(template)
    		}

    		// Sort files
			main_class.sort_files()
		}

	    return this

	}

}( jQuery ))