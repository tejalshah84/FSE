    var socket = io.connect();
    

    $(function(){
        socket.emit('nickname', {
                    nickname: $('.nickname').text()
                    });
       
    });


    socket.on('chat', function (data) {
        appendPostMessage(data);
    });

        
    $(function(){
        $('#sendMessageButton').on('click', function(){
            if($('#postMessage').val() !== ''){
                    socket.emit('chat', {
                    message: $('#postMessage').val()
                });
                
                $('#postMessage').val('');
                $('#chatMessageArea').animate({ scrollTop: $(document).height() }, "slow");  
            }
            
        });

    });


    var appendPostMessage= function(data){
        var oldpost= '<div class="oldpost">' 
                    + '<p class="oldpostUser pull-left">' + data.userName + '</p>'
                    + '<p class="oldpostTime pull-right">' + moment(data.timeStamp).format("MM/DD/YYYY h:mm A") + '</p>'
                    + '<div class="clear-float"></div>'
                    + '<p class="oldpostMessage">' + data.message + '</p>'
                    + '</div>'+'\n'


        $('#chatMessageArea').append(oldpost);
    };