import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { WorkflowModel } from  '../../../shared/metadataModels/workflowModel';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-valkyrie', 'valkyrie');

export default class BypassWorkflowRules extends SfdxCommand {

    public static description = messages.getMessage('bypassWorkflowCmdDescription');
    public static examples = [`
        sfdx vlk:bypasser:workflows -u someOrg
        sfdx vlk:bypasser:workflows -u someOrg -o Account,Contact
        sfdx vlk:bypasser:workflows -u someOrg -n Bypasser_API_Name__c
    `];

    protected static requiresUsername = true;

    protected static flagsConfig = {
        objects: flags.string({char: 'o', description: messages.getMessage('objectFilterFlagDescript')}),
        name: flags.string({char: 'n', description: messages.getMessage('bypasserNameFlagDescript'), required: true})
    };

    public async run(): Promise<any> {

        let filters = [];
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',');
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, WorkflowModel);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, WorkflowModel.functionalName, filters);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels(filters);

        return await bypasserScanner.exec(models);
    }
}