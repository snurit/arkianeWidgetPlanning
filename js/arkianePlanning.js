(function($) {
    $.fn.arkianePlanning = function(options) {
        // Default settings
        var settings = $.extend({
            target: "#calendar",
            action: "build",
            //Minimum number of day before an available booking date
            minBookingDate : "+3D",
            //Maximum booking date
            //numberOfMonths: [ 2, 3 ],
            maxBookingDate: "+8M",
            selectWeek: true,
            culture: "fr_FR",
            default_duration: 7,
            site: 1
        }, options );
        
        var base_url = "http://web4g.arkiane.com/api/api/"+settings.usr+"/"+settings.pwd+"/"+settings.agency+"/"+settings.site+"/"+settings.culture+"/";
        
        //test

        // Days available
        var dt = new Array();
        // Start booking dates available
        var ds = new Array();
        // End booking dates available
        var de = new Array();

        // Date & accomodation
        var startDate = '';
        var endDate = '';
        var accomodation = null;

        buildForm();

        //Build the base arkiane JQuery UI calendar
        if ( settings.action === "build") {
            // getting availabilities
            getAvailabilities();
            // getting available start date
            getAvailableDate();

            $("#calendar-widget").datepicker({
                numberOfMonths: 1,
                showButtonPanel: true,
                minDate : settings.minBookingDate,
                maxDate : settings.maxBookingDate,
                firstDay : 1,
                //Translating widget to FR
                altField: "#datepicker",
                closeText: 'Fermer',
                prevText: 'Précédent',
                nextText: 'Suivant',
                currentText: 'Aujourd\'hui',
                monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
                dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
                dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
                dayNamesMin: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
                weekHeader: 'Sem.',
                dateFormat: 'yy-mm-dd',
                beforeShowDay: function(date){
                    var dateNext = addDay(date);
                    // date is available day and is a start date
                    if (($.inArray(dateNext.toISOString().substr(0,10), dt) != -1) && ($.inArray(dateNext.toISOString().substr(0,10), ds) != -1)) {
                        return [true,"ap-isBookable",""];
                    // date is available but is not a start date
                    } else if($.inArray(dateNext.toISOString().substr(0,10), dt) != -1) {
                        return [false,"ap-isAvailable",""];
                    }else{
                    // date is unavailable
                        return [false,"ap-isUnavailable",""];
                    }
                },
                onSelect: function(selected, evnt){
                    //hiding price displayed or no price message
                    $("#calendar-infos").hide();
                    $("#ap-no-price").hide();
                    if ($.inArray(selected, ds) >= 0) {
                        var arr = selected.split('-');
                        $("input[name=startdate]").val(arr[2]+'/'+arr[1]+'/'+arr[0]);
                        //$("#dateStart").text("Début de séjour : "+selected);

                        startDate = selected;
                        // Get available end date for accomation and selected start date
                        getAvailableDate(selected);
                    }else{
                        $("input[name=startdate]").val("");
                        $("#dateStart").text("");
                    }
                }
            });

            //Show the hidden calendar
            
            $(settings.target).css("visibility", "visible");
        }

        function builDatePicker(){

        }

        //Retrieving available date for a lot_no
        function getAvailabilities(){
            var url = base_url+"Planning/Get?lot_no="+settings.lot_no;
            var req = $.ajax({dataType: "jsonp", url: url});

            req.done(function(data){
                $.each(data, function( index, value ){
                    Array.prototype.push.apply(dt, getDateRange(value.dispo_deb.substr(0,10), value.dispo_fin.substr(0,10)));
                });
            });

            //Done when an error occur
            req.fail(function(){
                console.log("ERROR : unable to GET accomodation availabilities");
                return false;
            });

            req.always(function(){
                //refreshing calendar to avoid an issue : a full non availabilities on the first month when calendar is loaded (AJAX problem)
                console.log("CALENDAR REFRESH");
                $("#calendar-widget").datepicker("refresh");
            });
        }

        function getAvailableDate(std = ""){
            var url = base_url+"Dates/Get?lot_no="+settings.lot_no;
            var tmp_data = new Array();
            if(std != ""){
                de = new Array();
                url = url+"&startDate="+std;
            }

            console.log(url);

            var req = $.ajax({dataType: "jsonp", url: url});
            
            //Success
            req.done(function(data){
                $.each(data, function( index, value ){
                    tmp_data.push(value.substr(0,10));
                });
            });

            req.always(function(){
                if(std != ""){
                    de = tmp_data;
                    console.log("GETAVAILABILITIES - In std !=''");
                    setPricesByDuration();
                }else{
                    ds = tmp_data;
                    console.log("GETAVAILABILITIES - In std ==''");
                }
            });

            // Error
            req.fail(function(){
                console.log("ERROR : unable to GET available dates");
            });

            return req;
        }

        function getAccomodationDetails(edt = ""){
            console.log("GETACCOMODATIONDETAILS - in & edt="+edt);
            var std = startDate.substr(8,2)+'-'+startDate.substr(5,2)+'-'+startDate.substr(0,4);
            
            var url = base_url+"Details/?lot_no="+settings.lot_no+"&startDate="+std+"&endDate="+ edt;
            console.log(url);
            var req = $.ajax({dataType: "jsonp", url: url, beforeSend: function(){
                console.log("GETACCOMODATIONDETAILS - in ajax");
                // When populating a jquery dropdown list
                //$("select[name=duration]").empty();
                $("#ap-wait").show();
            } });

            req.done(function (data){
                //hide the waiter
                $("#ap-wait").hide();
                
                try{
                    console.log("GETACCOMODATIONDETAILS - in DONE & prix = "+data.LotDetails[0].prix);
                    if(data.LotDetails[0].p_sr != "0"){
                        $("#holidays-price-sr").text(data.LotDetails[0].p_sr + " €");
                    }
                    $("#holidays-price").text(data.LotDetails[0].prix + " €");
                    $("input[name=enddate]").val(edt);
                    $("#calendar-infos").show();

                    // Dropdown list implement
                    //$("select[name=duration]").append('<option value="'+edt+'">'+ diffDays +' jours - A partir de '+data.LotDetails[0].prix+' €</option>');
                    //$("select[name=duration]").selectmenu('refresh');
                }catch(err){
                    // price not set
                    console.log("GETACCOMODATIONDETAILS - in DONE & prix UNDEFINED");
                    $("#ap-no-price").show();
                }
                return data;
            });

            req.always(function(){
                //hide the waiter
                $("#ap-wait").hide();
            });
            
            // Error
            req.fail(function(){
                console.log("ERROR : unable to GET available start dates");
                return false;
            });
        }

        //return an array of date between 2 dates
        function getDateRange(dateStart, dateEnd){
            var range = new Array();
            var currDate = new Date(dateStart);
            var tgtDate = new Date(dateEnd);

            while(currDate <= tgtDate){
                range.push(currDate.toISOString().substr(0,10));
                currDate = addDay(currDate);
            }
            return range;
        }
        
        //Add one day to increment a date
        function addDay(date){
            var result = new Date(date);
            result.setDate(result.getDate() + 1);
            return result;
        }

        // Populate menu list with prices by duration
        function setPricesByDuration(){
            console.log("SETPRICESBYDURATION")
            //fill the price span
            console.log("date selectionnée :"+de[0]);
            getAccomodationDetails(de[0]);
            /*
            //implement for populating a dropdown list
            for(i = 0; i < de.length; i++){
                console.log("SETPRICESBYDURATION -- in loop")
                getAccomodationDetails(de[i]);
            }
            */
        }

        function buildForm(){
            // creating a div for calendar
            $(settings.target).append('<div id="calendar-widget" class="ll-skin-cangas"></div>');

            //waiter
            $(settings.target).append('<div id="ap-wait" style="display:none">Merci de patienter<br/><img src="http://webparts.montagneimmo.com/arkianeWidgetPlanning/css/images/ajax-loader.gif" alt="chargement en cours" /></div>');

            // message when a price is not set
            $(settings.target).append('<div id="ap-no-price" style="display:none"></div>');
            $("#ap-no-price").append('<p>Appartement disponible a cette date.<br/><br/>Contactez-nous au <br/><strong>04 79 05 95 22</strong> <br/>pour connaitre les modalités tarifaires et services disponibles.<br/><br/>Vous pouvez aussi sélectionner une autre date.</p>');

            // creating a div for showing booking information
            $(settings.target).append('<div id="calendar-infos" style="display:none"></div>');
            $("#calendar-infos").append('<p>Votre séjour à partir de <br/><span id="holidays-price-sr"><br/></span> <span id="holidays-price"></span></p>');

            // Stay duration
            //$("#calendar-infos").append('<label for="duration">Durée de votre séjour</label>');
            //$("#calendar-infos").append('<select name="duration" id="duration">');
            //$("select[name=duration]").selectmenu();
            //$("select[name=duration]").on( "selectmenuselect", function() { $("input[name=enddate]").val($( "select[name=duration]" ).val());} );

            // Cancel insurance (disabled)
            /*
            $("#calendar-infos").append('<fieldset name="insurance-select"><legend>Assurance annulation</legend></fieldset>');
            $("fieldset[name=insurance-select]").append('<label for="insurance-yes">J accepte</label><input type="radio" name="insurance-select" id="insurance-yes" value="rubr_assurance|true">');
            $("fieldset[name=insurance-select]").append('<label for="insurance-no">Je refuse</label><input type="radio" name="insurance-select" id="insurance-no" value="rubr_assurance|false">');
            $("input[name=insurance-select]").checkboxradio().on( "change", function() { $("#input-insurance").val($('input[name=insurance-select]:checked').val()); console.log('insurance select');} );
            */

            $("#calendar-infos").append('<form action="http://montagneimmo.arkiane.com/fr-FR/Resa/Validate" method="post" name="calendar-form" target="_blank"></form>');
            // init calendar-infos content
            $("form[name=calendar-form]").append('<input type="hidden" name="lot_no" value="'+settings.lot_no+'">');
            $("form[name=calendar-form]").append('<input type="hidden" name="comm_no" value="101">');
            $("form[name=calendar-form]").append('<input type="hidden" name="startdate">');
            $("form[name=calendar-form]").append('<input type="hidden" name="enddate">');
            
            //$("form[name=calendar-form]").append('<input type="hidden" name="selectedRubriques" id="input-insurance" value="rubr_assurance|true">');
            // NbAdultes set by default to 0
            //$("form[name=calendar-form]").append('<input type="hidden" name="selectedRubriques" value="nb_adultes|0">');
            // NbEnfants set by default to 0
            //$("form[name=calendar-form]").append('<input type="hidden" name="selectedRubriques" value="nb_enfants|0">');
            // Submit button
            $("form[name=calendar-form]").append('<input type="submit" value="Réserver">');
        }
    };
}(jQuery));