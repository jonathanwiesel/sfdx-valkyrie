import { UX } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { MetadataModel } from  './metadataModels/base';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-valkyrie', 'valkyrie');

export class BypasserScanner {

    private activeObjs = 0;
    private invalidObjs = [];
    
    constructor(private ux: UX, private bypasserName: string, private functionalName: string, private relatedSObjsToFilter: Array<string> = []) {

        this.bypasserName = this.bypasserName.toLowerCase();

        const msgReplacers = {
            "%METADATA%": this.functionalName, 
            "%BYPASSERNAME%": this.bypasserName, 
            "%OBJECTS%": this.relatedSObjsToFilter.length ? 
                        this.relatedSObjsToFilter.join(',') : 
                        messages.getMessage('allObjectsMsg')
        };

        const lookingMsg = messages.getMessage('bypassScanningMsg').replace(/%\w+%/g, function(all) {
            return msgReplacers[all] || all;
         });

         this.ux.styledHeader(lookingMsg);
    }

    /** 
     * Routing method that orchestrates the logic 
     */
    public async exec(models: Array<MetadataModel>): Promise<Array<any>> {

        for (let model of models) {

            if (model.filterObject()) {

                this.activeObjs++;

                if (!model.doesHaveBypasser(this.bypasserName)) {
                    this.invalidObjs.push(model);
                }
            }
        }


        this.printResult();

        return this.invalidObjs;
    } 

    /**
     * Print the results found
     */
    private printResult(): void {

        const msgReplacers = {
            "%INVALID%": this.invalidObjs.length, 
            "%ACTIVE%": this.activeObjs, 
            "%METADATA%": this.functionalName
        };

        const resultMsg = messages.getMessage('bypassResultsMsg').replace(/%\w+%/g, function(all) {
            return msgReplacers[all];
         });

        this.ux.styledHeader(resultMsg);
        
        this.ux.table(this.invalidObjs, {
            columns: [
                { key: 'sobjName' },
                { key: 'metadataName' }
            ]
        });
    }
    
}