$('document').ready(function(){
  $( "#origGroupList, #modifiedGroupList" ).sortable({
      connectWith: ".connectedSortable"
    }).disableSelection();
});