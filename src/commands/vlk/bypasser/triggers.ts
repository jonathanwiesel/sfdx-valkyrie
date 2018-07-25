import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner'; 
import { MetadataModel } from  '../../../shared/metadataModels/base';
import { TriggerModel } from  '../../../shared/metadataModels/triggerModel';
import { ApexClassModel } from  '../../../shared/metadataModels/apexClassModel';

export default class BypassValidRules extends SfdxCommand {

    public static description = 'Scan for bypassers in triggers';
    public static examples = [`
sfdx vlk:bypasser:triggers -u someOrg
sfdx vlk:bypasser:triggers -u someOrg -o Account,Contact
sfdx vlk:bypasser:triggers -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: {char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many'},
        name: {char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default'},
        factory: {char: 'f', type: 'string', description: 'specify the trigger factory to search for the bypasser'}
    };

    public async run(): Promise<any> {

        let bypassScanner: BypasserScanner;

        if (this.flags.factory) {

            bypassScanner = new BypassTriggersFactoryImpl(this.ux, this.org, this.flags.name, [this.flags.factory]);

        } else {

            let filters;
        
            if (this.flags.objects) {
                filters = this.flags.objects.split(',');
            }

            bypassScanner = new BypassTriggersImpl(this.ux, this.org, this.flags.name, null, filters);
        }

        await bypassScanner.exec();
    }
}

class BypassTriggersImpl extends BypasserScanner {

    protected functionalName = 'triggers';
    protected metadataObj = 'ApexTrigger';

    protected analizeObject(objDescribe: any): Array<MetadataModel> {
        return TriggerModel.createModelsFromDescribe(objDescribe);
    }
}


class BypassTriggersFactoryImpl extends BypasserScanner {

    protected functionalName = 'trigger factory';
    protected metadataObj = 'ApexClass';

    protected analizeObject(objDescribe: any): Array<MetadataModel>  {
        return ApexClassModel.createModelsFromDescribe(objDescribe);
    }
}