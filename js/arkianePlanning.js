(function($) {
    $.fn.arkianePlanning = function(options) {
        // Default settings
        var settings = $.extend({
            target: "#calendar",
            action: "build",
            //Minimum number of day before an available booking date
            minBookingDate : "+3D",
            //Maximum booking date
            maxBookingDate: "+8M",
            site: 1
        }, options );
        
        // Days available
        var dt = new Array();
        // Start bookin fays available
        var ds = new Array();

        buildForm();

        //Build the base arkiane JQuery UI calendar
        if ( settings.action === "build") {
            // getting availabilities
            getAvailabilities(settings.usr, settings.pwd, settings.agency, settings.lot_no, settings.site);
            getAvailableStartDate(settings.usr, settings.pwd, settings.agency, settings.lot_no, settings.site);

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
                    if ($.inArray(date.toISOString().substr(0,10), dt) >= 0) {
                        return [true,"date-available",""];
                    } else {
                        return [false,"date-unavailable",""];
                    }
                },
                onSelect: function(selected, evnt){
                    if ($.inArray(selected, ds) >= 0) {
                        var arr = selected.split('-');
                        $("input[name=startdate]").val(arr[2]+'/'+arr[1]+'/'+arr[0]);
                        var tmp = new Date(selected);
                        tmp.setDate(tmp.getDate() + 7);
                        arr = tmp.toISOString().substr(0,10).split('-');
                        $("input[name=enddate]").val(arr[2]+'/'+arr[1]+'/'+arr[0]);
                        $("#calendar-infos").css("visibility", "visible");
                    }
                }
            });

            //Show the hidden calendar
            $(settings.target).css("visibility", "visible");
        }

        //Retrieving available date for a lot_no
        function getAvailabilities(usr, pwd, agency, lot_no, culture = "fr_FR", site = 1)
        {
            var url = "http://web4g.arkiane.com/api/api/"+usr+"/"+pwd+"/"+agency+"/"+site+"/fr-FR/Planning/Get?lot_no="+lot_no;
            var req = $.ajax({dataType: "jsonp", url: url, success: function(data) {
                $.each(data, function( index, value ){
                    Array.prototype.push.apply(dt, getDateRange(value.dispo_deb.substr(0,10), value.dispo_fin.substr(0,10)));
                });

                console.log("Nombre de jours dispos = "+dt.length);
            }});

            //Done when an error occur
            req.fail(function(){
                console.log("ERROR : unable to GET availabilities");
                return false;
            });
        }

        function getAvailableStartDate(usr, pwd, agency, lot_no, culture = "fr_FR", site = 1){
            var url = "http://web4g.arkiane.com/api/api/"+usr+"/"+pwd+"/"+agency+"/"+site+"/fr-FR/Dates/Get?lot_no="+lot_no;
            var req = $.ajax({dataType: "jsonp", url: url, success : function (data) {
                $.each(data, function( index, value ){
                    ds.push(value.substr(0,10));
                });
                console.log("Nombre de jour de début spécifiés = "+ds.length);
            }});
            
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
        function addDay(date) {
            var result = new Date(date);
            result.setDate(result.getDate() + 1);
            return result;
        }

        function buildForm(){
            // creating a div for calendar
            $(settings.target).append('<div id="calendar-widget"></div>');

            // creating a div for showing booking information
            $(settings.target).append('<div id="calendar-infos" style="visibility:hidden"></div>');
            $("#calendar-infos").append('<form action="http://montagneimmo.arkiane.com/fr-FR/Resa/Validate" method="post" name="calendar-form" target="_blank"></form>');
            // init calendar-infos content
            $("form[name=calendar-form]").append('<input type="hidden" name="lot_no" value="'+settings.lot_no+'">');
            $("form[name=calendar-form]").append('<input type="hidden" name="comm_no" value="101">');
            $("form[name=calendar-form]").append('<input type="hidden" name="startdate">');
            $("form[name=calendar-form]").append('<input type="hidden" name="enddate">');
            // Submit button
            $("form[name=calendar-form]").append('<input type="submit" value="Réserver">');
        }
    };
}(jQuery));