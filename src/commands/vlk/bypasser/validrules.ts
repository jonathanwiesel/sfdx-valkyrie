import { SfdxCommand } from '@salesforce/command';
import { cli } from 'cli-ux';

export default class ValidRules extends SfdxCommand {

    public static description = 'Scan for bypassers in validation rules';

    public static examples = [
    `sfdx vlk:bypasser:validrules -u someOrg
    `];

    protected static requiresUsername = true;
    protected static flagsConfig = {};
    protected static requiresProject = false;

    private DEFAULT_BYPASSER = '$setup.bypass_general__c';

    public async run(): Promise<any> {

        //TODO: bypasser name can be passed as a parameter in case the name is different
        //      specific objets can be passed as a parameter to only check for those
        //      ability to export results to a file so the final user can take corrective measures
        //      progress indicator since iterating over all object would take a while

        const conn = await this.org.getConnection();
        const types = [{type: 'CustomObject', folder: null}];

        cli.action.start('Getting available sobjects...');
        const sobjsData = await conn.metadata.list(types, await this.org.retrieveMaxApiVersion());
        cli.action.stop();

        const sobjs = sobjsData.map(item => item.fullName);
        
        let sobjGroups = this.getSObjSubgroups(sobjs);

        let activeRules = 0;
        let invalidRules = [];
        let loopCounter = 1;

        for (const sobjGroup of sobjGroups) {

            cli.action.start('Getting sobjects details ' + loopCounter + '/' + sobjGroups.length + '...');

            let objsDescribe = await conn.metadata.read('CustomObject', sobjGroup);

            cli.action.stop();

            if (!(objsDescribe instanceof Array)) {
                objsDescribe = [objsDescribe];
            }

            for (let objDescribe of objsDescribe) {

                if (objDescribe['validationRules'] && objDescribe['validationRules'].length) {

                    for (const validationRule of objDescribe['validationRules']) {
                        
                        if (validationRule.active === 'true') {
                            
                            activeRules++;

                            if (!this.doesHaveBypasser(validationRule)) {
                                invalidRules.push(validationRule);
                            }
                        }
                    }
                }
            }

            loopCounter++;
        }


        this.ux.log('There are ' + invalidRules.length + ' active validation rules of ' + activeRules + ' without bypassers.');
    }


    private getSObjSubgroups(sobjData: Array<string>): Array<Array<string>> {

        let sobjGroups = [];
        let actualIndex = 0;

        while (actualIndex < sobjData.length) {
            
            let sobjGroup = [];
            for (let i = 0; i < 10 && actualIndex < sobjData.length; i++) {
                sobjGroup.push(sobjData[actualIndex]);
                actualIndex++;
            }

            sobjGroups.push(sobjGroup);
        }

        return sobjGroups;
    }


    private doesHaveBypasser(validationRule: any, bypasserName = this.DEFAULT_BYPASSER): boolean {
        return validationRule.errorConditionFormula.toLowerCase().indexOf(bypasserName) >= 0;
    }
}