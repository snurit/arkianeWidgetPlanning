(function($) {
    $.fn.arkianePlanning = function(options) {
        // Default settings
        var settings = $.extend({
            target: "#arkianePlanningWidget",
            //Minimum number of day before an available booking date
            minBookingDate : "+3D",
            //numberOfMonths: [ 2, 3 ],
            maxBookingDate: "+8M",
            selectWeek: true,
            culture: "fr_FR",
            default_duration: 7,
            site: 1
        }, options );

        // Default culture Jquery Calendar st to FR_fr
        var settingsCulture = {
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
            dateFormat: 'yy-mm-dd'
        };
        
        var base_url = "http://web4g.arkiane.com/api/api/"+settings.usr+"/"+settings.pwd+"/"+settings.agency+"/"+settings.site+"/"+settings.culture+"/";

        // Days available
        var dt = new Array();
        // Start booking dates available
        var ds = new Array();
        // End booking dates available
        var de = new Array();

        // Date & accomodation
        var startDate = '';
        var endDate = '';

        //Waiting for AJAX queries to finish
        $.when(getAvailabilities(), getAvailableDate()).done(function(availabilitiesParameters, availableDateParameters){
            console.log("IN WHEN - AJAX CALLBACKS FINISHED");
            buildForm();
            buildStartCalendar();
        });

        //Show the hidden widget
        $(settings.target).css("visibility", "visible");

        // Building the Calendar for start dates
        function buildStartCalendar(){
            $("#arkianePlanning-calendarStart").datepicker($.extend({
                numberOfMonths: 2,
                showButtonPanel: true,
                minDate : settings.minBookingDate,
                maxDate : settings.maxBookingDate,
                firstDay : 1,
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
                    startDate = selected;
                    $("input[name=startdate]").val(startDate);
                    console.log("CALENDAR START : Setting START date to "+selected);
                    //Waiting for AJAX retrieving dates
                    $.when(getAvailableDate(startDate)).done(function(availableEndDateParameters){
                        buildEndCalendar();
                        $("#arkianePlanning-calendarStart").hide();
                        $("#arkianePlanning-calendarEnd").datepicker("refresh");
                        $("#arkianePlanning-calendarEnd").show();
                    });
                }
            },settingsCulture));
        }

        // Building the calendar for end date
        function buildEndCalendar(){
            $("#arkianePlanning-calendarEnd").datepicker($.extend({
                numberOfMonths: 2,
                showButtonPanel: true,
                minDate : settings.minBookingDate,
                maxDate : settings.maxBookingDate,
                firstDay : 1,
                defaultDate: startDate,
                beforeShowDay: function(date){
                    var dateNext = addDay(date);
                    // date is available day and is a end date
                    if (($.inArray(dateNext.toISOString().substr(0,10), dt) != -1) && ($.inArray(dateNext.toISOString().substr(0,10), de) != -1)) {
                        return [true,"ap-isBookable",""];
                    // date is available but is not a end date
                    } else if($.inArray(dateNext.toISOString().substr(0,10), dt) != -1) {
                        return [false,"ap-isAvailable",""];
                    }else{
                    // date is unavailable
                        return [false,"ap-isUnavailable",""];
                    }
                },
                onSelect: function(selected, evnt){
                    console.log("CALENDAR END : Setting END date to "+selected);
                    endDate = selected;
                    $("input[name=enddate]").val(endDate);
                    $("#arkianePlanning-calendarEnd").hide();
                    setPricesByDuration();
                }
            },settingsCulture));
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

            });

            return req;
        }

        function getAvailableDate(std = ""){
            var url = base_url+"Dates/Get?lot_no="+settings.lot_no;
            var tmp_data = new Array();
            
            //if a start date is set, we get the end dates
            if(std != ""){
                de = new Array();
                url = url+"&startDate="+std;
            }

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
                    console.log("GETAVAILABILITIES - END DATES");
                    //setPricesByDuration();
                }else{
                    ds = tmp_data;
                    console.log("GETAVAILABILITIES - START DATE");
                }
            });

            // Error
            req.fail(function(){
                console.log("ERROR : unable to GET available dates");
            });

            return req;
        }

        function getAccomodationDetails(){
            console.log("GETACCOMODATIONDETAILS");
            var std = startDate.substr(8,2)+'-'+startDate.substr(5,2)+'-'+startDate.substr(0,4);
            var url = base_url+"Details/?lot_no="+settings.lot_no+"&startDate="+std;
            // If a end Date is set
            if(endDate != '')
                url = url +  "&endDate="+ endDate;

            var req = $.ajax({dataType: "jsonp", url: url, beforeSend: function(){
                console.log("GETACCOMODATIONDETAILS - in ajax");
                 $("#ap-wait").show();
            } });

            req.done(function (data){
                //hide the waiter
                $("#ap-wait").hide();
                
                // Catching exception for a unset price (lot_no available but call needed for informations)
                try{
                    console.log("GETACCOMODATIONDETAILS - in DONE & prix = "+data.LotDetails[0].prix);
                    if(data.LotDetails[0].p_sr != "0"){
                        $("#holidays-price-sr").text(data.LotDetails[0].p_sr + " €");
                    }
                    $("#holidays-price").text(data.LotDetails[0].prix + " €");
                    $("#calendar-infos").show();
                }catch(err){
                    console.log(err);
                    // price not set
                    console.log("GETACCOMODATIONDETAILS - in DONE & prix UNDEFINED");
                    $("#ap-no-price").show();
                }
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

            return req;
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
            console.log("date selectionnée :"+endDate);
            getAccomodationDetails(endDate);
        }

        //reset the widget
        function arkPlanFormReset(){
            startDate = '';
            endDate = '';
            $("#calendar-infos").hide();
            $("#arkianePlanning-calendarStart").datepicker( "refresh" );
            $("#arkianePlanning-calendarStart").datepicker("setDate");
            $("#arkianePlanning-calendarEnd").datepicker( "refresh" );
            $("#arkianePlanning-calendarEnd").datepicker("setDate");
            $("#arkianePlanning-calendarStart").show();
        }

        function buildForm(){
            // creating a div for calendars
            $(settings.target).append('<div id="arkianePlanning-calendarStart" class="ll-skin-cangas"><p>Choisissez votre date de d arrivée</p></div>');
            $(settings.target).append('<div id="arkianePlanning-calendarEnd" style="display:none" class="ll-skin-cangas"><p>Choisissez votre date de départ</p></div>');

            //waiter
            $(settings.target).append('<div id="ap-wait" style="display:none;text-align:center"><p>Merci de patienter</p><img src="http://webparts.montagneimmo.com/arkianeWidgetPlanning/css/images/ajax-loader.gif" alt="chargement en cours" /></div>');

            // message when a price is not set
            $(settings.target).append('<div id="ap-no-price" style="display:none"></div>');
            $("#ap-no-price").append('<p>Appartement disponible a cette date</p><br/><br/>Contactez-nous au <br/><strong>04 79 05 95 22</strong> <br/>pour connaitre les modalités tarifaires et services disponibles.<br/><br/>Vous pouvez aussi sélectionner une autre date.');

            // creating a div for showing booking information
            $(settings.target).append('<div id="calendar-infos" style="display:none"></div>');
            $("#calendar-infos").append('<p>Votre séjour à partir de </p><span id="holidays-price-sr"><br/></span> <span id="holidays-price"></span>');

            $("#calendar-infos").append('<form action="http://montagneimmo.arkiane.com/fr-FR/Resa/Validate" method="post" name="calendar-form" target="_blank"></form>');
            // init calendar-infos content
            $("form[name=calendar-form]").append('<input type="hidden" name="lot_no" value="'+settings.lot_no+'">');
            $("form[name=calendar-form]").append('<input type="hidden" name="comm_no" value="101">');
            $("form[name=calendar-form]").append('<input type="hidden" name="startdate">');
            $("form[name=calendar-form]").append('<input type="hidden" name="enddate">');

            $("form[name=calendar-form]").append('<button type="submit" class="ui-button ui-widget ui-corner-all" value="Submit"><span class="ui-icon ui-icon-suitcase"></span> Réserver</button>');
            //$("form[name=calendar-form]").append('<p>ou</p>');
            $("form[name=calendar-form]").append('<button id="btn_arkPlanReset" type="reset" class="ui-button ui-widget ui-corner-all"><span class="ui-icon ui-icon-search"></span> Nouvelle recherche</button>');
            $("#btn_arkPlanReset").button().click(function(){arkPlanFormReset();});
        }
    };
}(jQuery));