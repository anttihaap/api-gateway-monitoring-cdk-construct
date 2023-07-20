import * as cdk from "aws-cdk-lib";
import { createMonitoringStackTemplate } from "./utils";

describe("SNS", () => {
  let stack: cdk.Stack;

  beforeEach(() => {
    stack = new cdk.Stack();
  });

  test("should create sns topic with email subscription when snsEmailAddress provided", () => {
    const template = createMonitoringStackTemplate(stack, {
      snsEmailAddress: "test@test523.com",
    });

    template.resourceCountIs("AWS::SNS::Topic", 1);
    template.hasResourceProperties("AWS::SNS::Subscription", {
      Protocol: "email",
      Endpoint: "test@test523.com",
    });
  });

  test("should not create subscription topic when not snsEmailAddress provided", () => {
    const template = createMonitoringStackTemplate(stack, {});

    template.resourceCountIs("AWS::SNS::Topic", 1);
    template.resourceCountIs("AWS::SNS::Subscription", 0);
  });
});
