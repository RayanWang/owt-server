var expect = require('chai').use(require('chai-as-promised')).expect;
var sinon = require('sinon');
var sinonAsPromised = require('sinon-as-promised');

var rpcClient = require('../rpcClient');
var rpcChannel = require('../rpcChannel');

describe('rpcClient.getController', function() {
  it('Should succeed if scheduling agent and requiring node succeed.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.resolve({id: 'RpcIdOfControllerAgent', info: {ip: 'x.x.x.x', purpose: 'session', state: 2, max_load: 0.85}}));
    mockRpcChannel.makeRPC.onCall(1).returns(Promise.resolve('RpcIdOfController'));

    var client = rpcClient(mockRpcChannel);

    return client.getController('woogeen-cluster', 'SessionId').then(function(result) {
      expect(result).to.equal('RpcIdOfController');
      expect(mockRpcChannel.makeRPC.getCall(0).args).to.deep.equal(['woogeen-cluster', 'schedule', ['session', 'SessionId', 30000]]);
      expect(mockRpcChannel.makeRPC.getCall(1).args).to.deep.equal(['RpcIdOfControllerAgent', 'getNode', [{session: 'SessionId', consumer: 'SessionId'}]]);
    });
  });

  it('Should fail if scheduling agent timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.reject('timeout or error while getting agent'));

    var client = rpcClient(mockRpcChannel);

    return expect(client.getController('woogeen-cluster', 'SessionId')).to.be.rejectedWith('timeout or error while getting agent');
  });

  it('Should fail if requiring node timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.resolve('RpcIdOfControllerAgent'));
    mockRpcChannel.makeRPC.onCall(1).returns(Promise.reject('timeout or error'));

    var client = rpcClient(mockRpcChannel);

    return expect(client.getController('woogeen-cluster', 'SessionId')).to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.getAccessNode', function() {
  it('Should succeed if scheduling agent and requiring node succeed.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.resolve({id: 'RpcIdOfAccessAgent', info: {ip: 'x.x.x.x', purpose: 'purpose', state: 2, max_load: 0.85}}));
    mockRpcChannel.makeRPC.onCall(1).returns(Promise.resolve('RpcIdOfAccessNode'));

    var client = rpcClient(mockRpcChannel);

    return client.getAccessNode('woogeen-cluster', 'purpose', {session: 'Session', consumer: 'ConnectionId'}).then(function(result) {
      expect(result).to.deep.equal({agent:'RpcIdOfAccessAgent', node: 'RpcIdOfAccessNode'});
      expect(mockRpcChannel.makeRPC.getCall(0).args).to.deep.equal(['woogeen-cluster', 'schedule', ['purpose', 'Session', 30000]]);
      expect(mockRpcChannel.makeRPC.getCall(1).args).to.deep.equal(['RpcIdOfAccessAgent', 'getNode', [{session: 'Session', consumer: 'ConnectionId'}]]);
    });
  });

  it('Should fail if scheduling agent timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.reject('timeout or error while getting agent'));

    var client = rpcClient(mockRpcChannel);

    return expect(client.getAccessNode('woogeen-cluster', 'purpose', {session: 'Session', consumer: 'ConnectionId'})).to.be.rejectedWith('timeout or error while getting agent');
  });

  it('Should fail if requiring node timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    mockRpcChannel.makeRPC.onCall(0).returns(Promise.resolve('RpcIdOfAccessAgent'));
    mockRpcChannel.makeRPC.onCall(1).returns(Promise.reject('timeout or error'));

    var client = rpcClient(mockRpcChannel);

    return expect(client.getAccessNode('woogeen-cluster', 'purpose', {session: 'Session', consumer: 'ConnectionId'})).to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.publish', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.resolves('ok');

    var onStatus = sinon.spy();

    return client.publish('rpcIdOfAccessNode',
                          'connectionId',
                          'connectionType',
                          {audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}},
                          onStatus)
      .then(function(result) {
        expect(result).to.deep.equal('ok');
        expect(mockRpcChannel.makeRPC.getCall(0).args[0]).to.equal('rpcIdOfAccessNode');
        expect(mockRpcChannel.makeRPC.getCall(0).args[1]).to.equal('publish');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][0]).to.equal('connectionId');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][1]).to.equal('connectionType');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][2]).to.deep.equal({audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}});
        expect(mockRpcChannel.makeRPC.getCall(0).args[3]).to.equal(onStatus);
      });
  });

  it('Should fail if rpcChannel.makeRPC timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.rejects('timeout or error');
    var onStatus = sinon.spy();

    return expect(client.publish('rpcIdOfAccessNode',
                                 'connectionId',
                                 'connectionType',
                                 {audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}},
                                 onStatus))
      .to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.subscribe', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.resolves('ok');

    var onStatus = sinon.spy();

    return client.subscribe('rpcIdOfAccessNode',
                          'connectionId',
                          'connectionType',
                          {audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}},
                          onStatus)
      .then(function(result) {
        expect(result).to.deep.equal('ok');
        expect(mockRpcChannel.makeRPC.getCall(0).args[0]).to.equal('rpcIdOfAccessNode');
        expect(mockRpcChannel.makeRPC.getCall(0).args[1]).to.equal('subscribe');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][0]).to.equal('connectionId');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][1]).to.equal('connectionType');
        expect(mockRpcChannel.makeRPC.getCall(0).args[2][2]).to.deep.equal({audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}});
        expect(mockRpcChannel.makeRPC.getCall(0).args[3]).to.equal(onStatus);
      });
  });

  it('Should fail if rpcChannel.makeRPC timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.rejects('timeout or error');
    var onStatus = sinon.spy();

    return expect(client.subscribe('rpcIdOfAccessNode',
                                 'connectionId',
                                 'connectionType',
                                 {audio: true, video: {resolution: 'vga', framerate: 30, divice: 'camera'}},
                                 onStatus))
      .to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.pub2Session', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.resolves('ok');

    return client.pub2Session('rpcIdOfController',
                          'participantId',
                          'streamId',
                          'accessNode',
                          {audio: {codecs: ['pcmu', 'opus']}, video: {codecs: ['vp8', 'h264'], resolution: 'vga', framerate: 30, divice: 'camera'}})
      .then(function(result) {
        expect(result).to.deep.equal('ok');
        expect(mockRpcChannel.makeRPC.getCall(0).args).to.deep.equal(['rpcIdOfController',
                                                                      'publish',
                                                                      ['participantId', 'streamId', 'accessNode', {audio: {codecs: ['pcmu', 'opus']}, video: {codecs: ['vp8', 'h264'], resolution: 'vga', framerate: 30, divice: 'camera'}}, false]]);
        return client.pub2Session('rpcIdOfController',
                              'participantId',
                              'streamId2',
                              'accessNode',
                              {audio: {codecs: ['pcmu', 'opus']}, video: {codecs: ['vp8', 'h264'], resolution: 'vga', framerate: 30, divice: 'camera'}},
                              true)
          .then(function(result) {
            expect(result).to.deep.equal('ok');
            expect(mockRpcChannel.makeRPC.getCall(1).args).to.deep.equal(['rpcIdOfController',
                                                                          'publish',
                                                                          ['participantId', 'streamId2', 'accessNode', {audio: {codecs: ['pcmu', 'opus']}, video: {codecs: ['vp8', 'h264'], resolution: 'vga', framerate: 30, divice: 'camera'}}, true]]);
          });
      });
  });

  it('Should fail if rpcChannel.makeRPC timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.rejects('timeout or error');
    var onStatus = sinon.spy();

    return expect(client.pub2Session('rpcIdOfController',
                                 'participantId',
                                 'streamId',
                                 'accessNode',
                                  {audio: {codecs: ['pcmu', 'opus']}, video: {codecs: ['vp8', 'h264'], resolution: 'vga', framerate: 30, divice: 'camera'}}))
      .to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.sub2Session', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.resolves('ok');

    var subscription_description = {audio: {fromStream: 'targetStreamId', codecs: ['opus']}, video: {fromStream: 'targetStreamId', codecs: ['vp8'], resolution: 'vga'}};
    return client.sub2Session('rpcIdOfController',
                            'participantId',
                            'subscriptionId',
                            'accessNode',
                            subscription_description)
      .then(function(result) {
        expect(result).to.deep.equal('ok');
        expect(mockRpcChannel.makeRPC.getCall(0).args).to.deep.equal(['rpcIdOfController',
                                                                      'subscribe',
                                                                      ['participantId', 'subscriptionId', 'accessNode', subscription_description]]);
      });
  });

  it('Should fail if rpcChannel.makeRPC timeout or error occurs.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.rejects('timeout or error');
    var onStatus = sinon.spy();

    var subscription_description = {audio: {fromStream: 'targetStreamId', codecs: ['opus']}, video: {fromStream: 'targetStreamId', codecs: ['vp8'], resolution: 'vga'}};
    return expect(client.sub2Session('rpcIdOfController',
                                   'participantId',
                                   'subscriptionId',
                                   'accessNode',
                                   subscription_description))
      .to.be.rejectedWith('timeout or error');
  });
});

describe('rpcClient.unpublish/unsubscribe/recycleAccessNode/unpub2Session/unsub2Session/leave', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'unpublish', ['connectionId']).returns(Promise.resolve('ok'));
    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'unsubscribe', ['connectionId']).returns(Promise.resolve('ok'));
    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessAgent', 'recycleNode', ['rpcIdOfAccessNode', {session: 'Session', consumer: 'connectionId'}]).returns(Promise.resolve('ok'));
    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'unpublish', ['participantId', 'streamId']).returns(Promise.resolve('ok'));
    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'unsubscribe', ['participantId', 'subscriptionId']).returns(Promise.resolve('ok'));
    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'leave', ['participantId']).returns(Promise.resolve('ok'));

    return Promise.all([
      expect(client.unpublish('rpcIdOfAccessNode', 'connectionId')).to.become('ok'),
      expect(client.unsubscribe('rpcIdOfAccessNode', 'connectionId')).to.become('ok'),
      expect(client.recycleAccessNode('rpcIdOfAccessAgent', 'rpcIdOfAccessNode', {session: 'Session', consumer: 'connectionId'})).to.become('ok'),
      expect(client.unpub2Session('rpcIdOfController', 'participantId', 'streamId')).to.become('ok'),
      expect(client.unsub2Session('rpcIdOfController', 'participantId', 'subscriptionId')).to.become('ok'),
      expect(client.leave('rpcIdOfController', 'participantId')).to.become('ok')
      ])
      .then(function() {
        expect(mockRpcChannel.makeRPC.callCount).to.equal(6);
      });
  });

  it('Should still succeed if rpcChannel.makeRPC fails.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.rejects('timeout or error');
    return Promise.all([
      expect(client.unpublish('rpcIdOfAccessNode', 'connectionId')).become('ok'),
      expect(client.unsubscribe('rpcIdOfAccessNode', 'connectionId')).become('ok'),
      expect(client.recycleAccessNode('rpcIdOfAccessAgent', 'rpcIdOfAccessNode', {session: 'Session', consumer: 'connectionId'})).to.become('ok'),
      expect(client.unpub2Session('rpcIdOfController', 'participantId', 'streamId')).become('ok'),
      expect(client.unsub2Session('rpcIdOfController', 'participantId', 'subscriptionId')).become('ok'),
      expect(client.leave('rpcIdOfController', 'participantId')).to.become('ok')
      ])
      .then(function() {
        expect(mockRpcChannel.makeRPC.callCount).to.equal(6);
      });
   });
});

describe('rpcClient.tokenLogin/join/onConnectionSignalling/mix/unmix/setVideoBitrate/mediaOnOff/getRegion/setRegion/text', function() {
  it('Should succeed if rpcChannel.makeRPC succeeds.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    var login_result = {userName: 'Jack', role: 'presenter', room: '573eab78111478bb3526421a'};
    mockRpcChannel.makeRPC.withArgs('nuve', 'deleteToken', 'tokenIdAsString').returns(Promise.resolve(login_result));
    var tokenLogin = client.tokenLogin('nuve', 'tokenIdAsString');

    var join_result = {participants: [],
                       streams: []};
    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'join', ['sessionId', {id: 'participantId', name: 'UserName', role: 'UserRole', portal: 'portalRpcId'}]).returns(Promise.resolve(join_result));
    var join = client.join('rpcIdOfController', 'sessionId', {id: 'participantId', name: 'UserName', role: 'UserRole', portal: 'portalRpcId'});

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode',
                                    'onConnectionSignalling',
                                    ['connectionId', {type: 'offer', sdp: 'offerSDPString'}]).returns(Promise.resolve('ok'));
    var onConnectionSignalling = client.onConnectionSignalling('rpcIdOfAccessNode', 'connectionId', {type: 'offer', sdp: 'offerSDPString'});

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'mix', ['participantId', 'streamId']).returns(Promise.resolve('ok'));
    var mix = client.mix('rpcIdOfController', 'participantId', 'streamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'unmix', ['participantId', 'streamId']).returns(Promise.resolve('ok'));
    var unmix = client.unmix('rpcIdOfController', 'participantId', 'streamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'setVideoBitrate', ['connectionId', 500]).returns(Promise.resolve('ok'));
    var setVideoBitrate = client.setVideoBitrate('rpcIdOfAccessNode', 'connectionId', 500);

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'mediaOnOff', ['connectionId', 'video', 'in', 'off']).returns(Promise.resolve('ok'));
    var mediaOnOff = client.mediaOnOff('rpcIdOfAccessNode', 'connectionId', 'video', 'in', 'off');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'getRegion', ['subStreamId']).returns(Promise.resolve('regionId1'));
    var getRegion = client.getRegion('rpcIdOfController', 'subStreamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'setRegion', ['subStreamId', 500]).returns(Promise.resolve('ok'));
    var setRegion = client.setRegion('rpcIdOfController', 'subStreamId', 500);

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'text', ['fromWhom', 'toWhom', 'message body']).returns(Promise.resolve('ok'));
    var text = client.text('rpcIdOfController', 'fromWhom', 'toWhom', 'message body');

    return Promise.all([
      expect(tokenLogin).to.become(login_result),
      expect(join).to.become(join_result),
      expect(onConnectionSignalling).to.become('ok'),
      expect(mix).to.become('ok'),
      expect(unmix).to.become('ok'),
      expect(setVideoBitrate).to.become('ok'),
      expect(mediaOnOff).to.become('ok'),
      expect(getRegion).to.become('regionId1'),
      expect(setRegion).to.become('ok'),
      expect(text).to.become('ok')
      ])
      .then(function() {
        expect(mockRpcChannel.makeRPC.callCount).to.equal(10);
      });
  });

  it('Should fail if rpcChannel.makeRPC fails with reason of timeout or error.', function() {
    var mockRpcChannel = sinon.createStubInstance(rpcChannel);
    mockRpcChannel.makeRPC = sinon.stub();
    var client = rpcClient(mockRpcChannel);

    mockRpcChannel.makeRPC.withArgs('nuve', 'deleteToken', 'tokenIdAsString').returns(Promise.reject('failed'));
    var tokenLogin = client.tokenLogin('nuve', 'tokenIdAsString');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'join', ['sessionId', {id: 'participantId', name: 'UserName', role: 'UserRole', portal: 'portalRpcId'}]).returns(Promise.reject('error or timeout'));
    var join = client.join('rpcIdOfController', 'sessionId', {id: 'participantId', name: 'UserName', role: 'UserRole', portal: 'portalRpcId'});

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode',
                                    'onConnectionSignalling',
                                    ['connectionId', {type: 'offer', sdp: 'offerSDPString'}]).returns(Promise.reject('error or timeout'));
    var onConnectionSignalling = client.onConnectionSignalling('rpcIdOfAccessNode', 'connectionId', {type: 'offer', sdp: 'offerSDPString'});

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'mix', ['participantId', 'streamId']).returns(Promise.reject('timeout'));
    var mix = client.mix('rpcIdOfController', 'participantId', 'streamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'unmix', ['participantId', 'streamId']).returns(Promise.reject('error'));
    var unmix = client.unmix('rpcIdOfController', 'participantId', 'streamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'setVideoBitrate', ['connectionId', 500]).returns(Promise.reject('timeout or error'));
    var setVideoBitrate = client.setVideoBitrate('rpcIdOfAccessNode', 'connectionId', 500);

    mockRpcChannel.makeRPC.withArgs('rpcIdOfAccessNode', 'mediaOnOff', ['connectionId', 'video', 'in', 'off']).returns(Promise.reject('timeout or error'));
    var mediaOnOff = client.mediaOnOff('rpcIdOfAccessNode', 'connectionId', 'video', 'in', 'off');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'getRegion', ['subStreamId']).returns(Promise.reject('no such a sub-stream'));
    var getRegion = client.getRegion('rpcIdOfController', 'subStreamId');

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'setRegion', ['subStreamId', 500]).returns(Promise.reject('some error'));
    var setRegion = client.setRegion('rpcIdOfController', 'subStreamId', 500);

    mockRpcChannel.makeRPC.withArgs('rpcIdOfController', 'text', ['fromWhom', 'toWhom', 'message body']).returns(Promise.reject('timeout or error'));
    var text = client.text('rpcIdOfController', 'fromWhom', 'toWhom', 'message body');

    return Promise.all([
      expect(tokenLogin).to.be.rejectedWith('failed'),
      expect(join).to.be.rejectedWith('error or timeout'),
      expect(onConnectionSignalling).to.be.rejectedWith('error or timeout'),
      expect(mix).to.be.rejectedWith('timeout'),
      expect(unmix).to.be.rejectedWith('error'),
      expect(setVideoBitrate).to.be.rejectedWith('timeout or error'),
      expect(mediaOnOff).to.be.rejectedWith('timeout or error'),
      expect(getRegion).to.be.rejectedWith('no such a sub-stream'),
      expect(setRegion).to.be.rejectedWith('some error'),
      expect(text).to.be.rejectedWith('timeout or error')
      ])
      .then(function() {
        expect(mockRpcChannel.makeRPC.callCount).to.equal(10);
      });
  });
});
