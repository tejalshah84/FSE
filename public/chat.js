    var socket = io.connect();
    

    socket.on('chat', function (data) {
        appendPostMessage(data);
    });

        
    $(function(){
        $('.postButton').on('click', function(){
            console.log($('.postMessage').val());
            socket.emit('chat', {
                message: $('.postMessage').val()
            });
            
            $('.postMessage').val('');

        });
    });


    var appendPostMessage= function(data){
    
        var oldpost= '<div class="oldpost">' 
                    + '<p class="oldpostUser">' + data.userName + '</p>'
                    + '<p class="oldpostTime">' + moment(data.timeStamp).format("MM/DD/YYYY h:mm A") + '</p>'
                    + '<p class="oldpostMessage">' + data.message + '</p>'
                    + '</div>'+'\n'


        $('.oldpostDisplayContainer').append(oldpost);
        console.log('append function used');
        console.log(data);
    };