import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 
import { MetadataModel } from  '../../../shared/metadataModels/base';
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

        let filters;
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',');
        }

        const bypasserScanner = new BypassWorkflowRulesImpl(this.ux, this.org, this.flags.name, filters, filters);

        await bypasserScanner.exec();
    }
}

class BypassWorkflowRulesImpl extends BypasserScanner {

    protected functionalName = 'workflow rules';
    protected metadataObj = 'Workflow';

    protected analizeObject(objDescribe: any): Array<MetadataModel> {
        return WorkflowModel.createModelsFromDescribe(objDescribe);
    }
}