import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { TriggerModel } from  '../../../shared/metadataModels/triggerModel';
import { ApexClassModel } from  '../../../shared/metadataModels/apexClassModel';

export default class BypassTriggers extends SfdxCommand {

    public static description = 'Scan for bypassers in triggers / trigger factories';
    public static examples = [`
sfdx vlk:bypasser:triggers -u someOrg
sfdx vlk:bypasser:triggers -u someOrg -o Account,Contact
sfdx vlk:bypasser:triggers -u someOrg -n Other_Bypasser_Name__c
sfdx vlk:bypasser:triggers -u someOrg -f S4GTriggerFactory
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'},
        factory: {char: 'f', type: 'string', description: 'specify the trigger factory to search for the bypasser'}
    };

    public async run(): Promise<any> {

        let metadataModel;
        let functionalName: string;
        let filters = [];
        let relatedObjs = [];

        if (this.flags.factory) {

            metadataModel = ApexClassModel;
            functionalName = ApexClassModel.functionalName;
            filters = this.flags.factory.split(',');
            relatedObjs = filters;

        } else {

            metadataModel = TriggerModel;
            functionalName = TriggerModel.functionalName;
            relatedObjs = this.flags.objects ? this.flags.objects.split(',') : [];
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, metadataModel);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, functionalName, relatedObjs);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels(filters, relatedObjs);

        await bypasserScanner.exec(models);
    }
}