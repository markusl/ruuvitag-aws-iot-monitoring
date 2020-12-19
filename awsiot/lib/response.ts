
export interface OnEventResponse {
    /**
     * A required custom resource provider-defined physical ID that is unique for
     * that provider.
     *
     * In order to reduce the chance for mistakes, all event types MUST return
     * with `PhysicalResourceId`.
     *
     * - For `Create`, this will be the user-defined or generated physical
     *   resource ID.
     * - For `Update`, if the returned PhysicalResourceId is different value from
     *   the current one, it means that the old physical resource needs to be
     *   deleted, and CloudFormation will immediately send a `Delete` event with
     *   the old physical ID.
     * - For `Delete`, this must be the same value received in the event.
     *
     * @default - for "Create" requests, defaults to the event's RequestId, for
     * "Update" and "Delete", defaults to the current `PhysicalResourceId`.
     */
    readonly PhysicalResourceId?: string;
  
    /**
     * Resource attributes to return.
     */
    readonly Data?: { [name: string]: any };
  
    /**
     * Custom fields returned from OnEvent will be passed to IsComplete.
     */
    readonly [key: string]: any;
  }