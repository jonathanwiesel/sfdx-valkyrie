import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { WorkflowModel } from  '../../../shared/metadataModels/workflowModel';

export default class BypassWorkflowRules extends SfdxCommand {

    public static description = 'Scan for bypassers in workflow rules';
    public static examples = [`
sfdx vlk:bypasser:workflows -u someOrg
sfdx vlk:bypasser:workflows -u someOrg -o Account,Contact
sfdx vlk:bypasser:workflows -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'}
    };

    public async run(): Promise<any> {

        let filters = [];
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',');
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, WorkflowModel);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, WorkflowModel.functionalName, filters);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels(filters);

        await bypasserScanner.exec(models);
    }
}