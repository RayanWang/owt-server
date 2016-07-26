/*
 * Copyright 2015 Intel Corporation All Rights Reserved. 
 * 
 * The source code contained or described herein and all documents related to the 
 * source code ("Material") are owned by Intel Corporation or its suppliers or 
 * licensors. Title to the Material remains with Intel Corporation or its suppliers 
 * and licensors. The Material contains trade secrets and proprietary and 
 * confidential information of Intel or its suppliers and licensors. The Material 
 * is protected by worldwide copyright and trade secret laws and treaty provisions. 
 * No part of the Material may be used, copied, reproduced, modified, published, 
 * uploaded, posted, transmitted, distributed, or disclosed in any way without 
 * Intel's prior express written permission.
 * 
 * No license under any patent, copyright, trade secret or other intellectual 
 * property right is granted to or conferred upon you by disclosure or delivery of 
 * the Materials, either expressly, by implication, inducement, estoppel or 
 * otherwise. Any license under such intellectual property rights must be express 
 * and approved by Intel in writing.
 */

#ifndef SIP_CALLCONNECTION_H
#define SIP_CALLCONNECTION_H

#include <node.h>
#include <SipCallConnection.h>
#include <node_object_wrap.h>
#include <string>

/*
 * Wrapper class of sip_gateway::SipCallConnection
 *
 * Represents connection between WebRTC clients and Sip clients.
 * Receives media from the WebRTC client and retransmits it to Sip client,
 * or receives media from Sip client and retransmits it to the WebRTC client.
 */
class SipCallConnection : public node::ObjectWrap {
 public:
  static void Init(v8::Local<v8::Object> exports);
  sip_gateway::SipCallConnection* me;

 private:
  SipCallConnection();
  ~SipCallConnection();

  static v8::Persistent<v8::Function> constructor;

  /*
   * Constructor.
   * Constructs a SipCallConnection.
   */
  static void New(const v8::FunctionCallbackInfo<v8::Value>& args);

  /*
   * Closes the SipCallConnection.
   * The object cannot be used after this call.
   */
  static void close(const v8::FunctionCallbackInfo<v8::Value>& args);


  static void setAudioReceiver(const v8::FunctionCallbackInfo<v8::Value>& args);
  /*
   * Sets a MediaReceiver that is going to receive Video Data
   * Param: the MediaReceiver
   */
  static void setVideoReceiver(const v8::FunctionCallbackInfo<v8::Value>& args);

};  // class SipCallConnection

#endif  // SIP_CALLCONNECTION_H