/* globals Vue, , _gaq */

var block = new Vue({ // eslint-disable-line no-unused-vars
  el: '#app',
  created() {
    this.viewerUserId = '';
    this.viewerUserName = '';

    this.startDate = null; //timestamp when process was started
  },
  mounted: () => {
    _gaq.push(['_trackPageview']);

    chrome.runtime.onMessage.addListener(function (request) {

      if (request.action === 'openMassBlockPage') {

        console.log(request);

        block.delay = request.followDelay; //FIXME

        block.viewerUserName = request.viewerUserName;
        block.viewerUserId = request.viewerUserId;

        block.csrfToken = request.csrfToken;
      }
    });

  },
  data: {
    isInProgress: false,

    delay: 0, //interval between sending the http requests

    stop: false, //if user requested the proceess to be stopped by clicking the button

    status: '', //the message displayed in status div
    statusColor: '',

    log: '', //the text displayed in log area
    ids: ''

  },
  computed: {
    startButtonDisabled: function () {
      return this.isInProgress
    },
    binding() {
      const binding = {};

      if (this.$vuetify.breakpoint.mdAndUp) {
        binding.column = true;
      }

      return binding;
    }
  },
  methods: {
    timeout: function (ms) {
      return new Promise(res => setTimeout(res, ms))
    },
    updateStatusDiv: function (message, color) {
      this.log += message + '\n';
      this.status = message;
      this.statusColor = color || 'black';
      setTimeout(function () {
        var textarea = document.getElementById('log_text_area');
        textarea.scrollTop = textarea.scrollHeight;
      }, 0);
    },
    startButtonClick: async function () {

      console.log(this.ids);

      this.isInProgress = true;

      var value = document.getElementById('ids').value;
      this.processUsers = value.replace(/[\n\r]/g, ',').split(',');
      this.blockedUsers = 0;
      this.processedUsers = 0;

      for (var i = 0; i < this.processUsers.length; i++) {
        if (this.processUsers[i] != '') {
          this.updateStatusDiv(`Mass blocking users: ${this.processUsers[i]}/${i + 1} of ${this.processUsers.length}`);

          var userId = this.processUsers[i];
          if (!/^\d+$/.test(userId)) {
            this.updateStatusDiv(`${userId} does not look as user id, maybe username, try to convert username to userid`);
            console.log('resolving username to userid', userId);
          }

          var result = await blockUser.block(
            {
              username: this.processUsers[i],
              userId: userId,
              csrfToken: this.csrfToken,
              updateStatusDiv: this.updateStatusDiv,
              vueStatus: this
            });
          this.processedUsers++;
          console.log(result);
          if ('ok' === result) {
            this.blockedUsers++;
          } else {
            console.log('Not recognized result - ' + result); // eslint-disable-line no-console
          }

          await this.timeout(this.delay);
        }
      }

      this.isInProgress = false;

      this.updateStatusDiv(
        `Completed!
          Processed: ${this.processedUsers}
          Blocked: ${this.blockedUsers}`);
    }
  }
});
