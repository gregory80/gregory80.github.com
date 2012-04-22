
newT.save("gitactivity.site", function(data) {
  return (
    newT.div({},
      newT.p("public ",
           newT.a({href:"https://github.com"}, "github.com"),
           " activity for ", newT.em(data.user), " ", data.since_date),
      newT.ul(
        newT.eachRender(data.summaries, "gitsummaries.site")
      ),
      newT.p(data.repos_list)//,
      //newT.eachRender(data.activity, "gitactivity_item.site")
    )
  )
});
newT.save("gitsummaries.site", function(data) {
  return (
    newT.li(data)
  )
});
newT.save("gitactivity_item.site", function(data) {
  var verb = "pushed to";
  if(data.type!=="PushEvent") {

    verb = data.payload.action;
  } 
  data.displayMessage = "";
  if(data.payload.commits) {
    var commits = data.payload.commits;
    data.displayMessage = commits[0].message;
    
  }
  return (
    newT.div(
      newT.div(verb, " ",
        newT.a({href:data.repo.url}, data.repo.name),
        " ",
        data.displayMessage)
    )
  )
});

newT.save("gitactivityform.site", function(data) {
  return (
    newT.div({clss:"git_activity_search_box"},
      newT.form({
        action:"#",
        clss:"form-vertical gitactivity_search_form"
        }, 
        newT.div({
          clss:"control-group"
        }, newT.label({clss:"control-label"}, "Check activity"),
        newT.div({clss:"controls"},
          newT.div({
            clss:"input-append"
          }, newT.input({
            type:"text",
            clss:"input-medium",
            placeholder:data.username,
            value:""
          }),
          newT.input({
            type:"submit",
            clss:"btn",
            value:"Search"
          })
          )
         )
      )
      )
    )
  )
});
(function (win) {

/**
*
*     var activity_lst = [];
    var ignore_events = ["WatchEvent", "ForkEvent", "IssueCommentEvent", "CreateEvent"];
    data.forEach(function(item) {
      if(item && ignore_events.indexOf( item.type ) < 0) {
        activity_lst.push(item);
      }
    });

*
* */
/**
*
*   simple call to get "latest" public
*   activity for user
*
* */
function commit_across_repos(data) {
  var counter = 0;
  var commit_counter = 0;
  for(var k in data) {
    if(k && data.hasOwnProperty(k)) {
      commit_counter += data[k].commits;
      if(data[k].commits) {
        counter += 1;
      }
    }
  }

  return commit_counter + " "+ plurald("commit", commit_counter) +" across " + counter + " " + plurald("repo", counter);
}
function count_type(type, data) {
  var count=0;
  data.forEach(function(item) {
    if(item.type === type) {
      count+=1;
    }
  });
  return count;
}
function total_forks(data) {
  var counter = count_type("ForkEvent", data);
  var verb = "repositories";
  if(counter === 1) {
    verb = "repository"
  }
  return "Forked " + counter + " " + verb; 
}

function total_pullrequests(data) {
  var counter = count_type("PullRequestEvent", data);
  return "Made " + counter + " pull " + plurald("request", counter); 
}
function total_watched(data) {
  var counter = count_type("WatchEvent", data);
  return "Watched " + counter + " repos"; 
}

function bindEvents(username) {
  $(".gitactivity_search_form").bind("submit", function(e) {
    e.preventDefault();
    $("#recent_git_activitiy").empty();
    var txt_value = $(this).find("input[type=text]" ).val();
    if(txt_value.length <=0) {
      txt_value = username;
    }
    get_latest( txt_value );
  });
}
function repos_list(data) {
  var items = [];
  for(var k in data) {
    if(k && data.hasOwnProperty(k)) {
      items.push(newT.a({
        href:data[k].url
      }, data[k].name));
      //items.push(", ")
    }
  }
  items = items.splice(0,10);
  var i = items.length;
  while(i-- && i>0) {
    items.splice(i,0,", ");
  }
  return newT.frag.apply(newT, items)
} 
function plurald( str, count ) {
  if(count === 1 || count === "1") {
    return str;
  } else {
    return str + "s";
  }
}
function since_date(data) {
  var months = ["jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov", "dev"];
  var last = data[data.length-1];
  var _date = new Date( last.created_at);

  return "since " + months[_date.getMonth()] + " " + _date.getDate() + ", " + _date.getFullYear();
  
}
function get_latest(username) {
  var base_url = "https://api.github.com";
  var url = base_url + "/users/"+username+"/events/public";
  var xhr = $.getJSON(url);
  return xhr.pipe(function(data) {
    // ccombine this data in a more interesting way
    var active_lst = [], item;
    var repos = {};
    var summaries = [];
    for(var i=0, len=data.length; i<len; i++) {
      item = data[i];
      if(!item.repo.id) continue;
      if(!repos[item.repo.id]) {
        repos[item.repo.id] = {
          commits:0,
          name:item.repo.name,
          url:item.repo.url
        };
      }
      if(item.payload.commits) {
        repos[item.repo.id].commits += item.payload.commits.length
      }
      
    }
    summaries.push(commit_across_repos(repos));
    summaries.push(total_forks(data));
    summaries.push(total_pullrequests(data));
    summaries.push(total_watched(data));
    return {
      user:username,
      since_date:since_date(data),
      summary:commit_across_repos(repos),
      summaries:summaries,
      activity:data,
      repos_list:repos_list(repos),
      repos:repos
    };
    //return data.slice(0,15);
  }).done(function(data) {
    newT.render("gitactivity.site", data, {
      el:$("#recent_git_activitiy").get(0)
    });
    
  });
;
}
win.index_page = function(git_user) {
  var promise = get_latest(git_user);
  promise.done(function() {
    $("#recent_git_activitiy").after(newT.render("gitactivityform.site", {
      username:git_user
    }));
    bindEvents( git_user );
  });
}

})(window);
$(function() {
  index_page( "gregory80" );
  $("#copy_year").text( (new Date()).getFullYear() )
});

