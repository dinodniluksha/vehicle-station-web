import { Component, OnInit } from '@angular/core';
import { VehicleService } from '../vehicle.service';
import { Vehicle } from '../vehicle';
import { Observable } from 'rxjs';
import {
  State,
  process,
  CompositeFilterDescriptor,
} from '@progress/kendo-data-query';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SocketServiceService } from '../socket-service.service';
import { NotifierService } from 'angular-notifier';

import {
  GridComponent,
  GridDataResult,
  DataStateChangeEvent,
  PageChangeEvent,
} from '@progress/kendo-angular-grid';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-vehicle-table',
  templateUrl: './vehicle-table.component.html',
  styleUrls: ['./vehicle-table.component.css'],
})
export class VehicleTableComponent implements OnInit {
  loading: boolean = true;
  vehicles: Vehicle[] = [];
  vehicle!: Vehicle;
  value!: boolean;
  availabilityRack: boolean[] = [];
  visibilityRack: boolean[] = [];
  private readonly notifier: NotifierService;

  view!: Observable<GridDataResult>;
  public gridState: State = {
    skip: 0,
    take: 3,
    filter: {
      logic: 'and',
      filters: [{ field: 'model', operator: 'contains', value: 'Chef' }],
    },
  };
  totalVehicles!: number;
  skip: number = 0;
  pageSize: number = 3;
  filter: CompositeFilterDescriptor = {
    logic: 'and',
    filters: [{ field: 'model', operator: 'contains', value: '' }],
  };
  keyWord: string = '';

  public gridView!: GridDataResult;

  private editedRowIndex: number | undefined;
  private editedProduct: Vehicle | undefined;

  dataItem = new Vehicle();

  public formGroup!: FormGroup;

  constructor(
    private service: VehicleService,
    private webSocketService: SocketServiceService,
    notifierService: NotifierService
  ) {
    this.getVehicles(this.keyWord, this.skip, this.pageSize);
    this.notifier = notifierService;
  }

  public pageChange(event: PageChangeEvent): void {
    this.skip = event.skip;
    console.log(this.skip);
    //this.loadItems(this.skip);
    this.getVehicles(this.keyWord, this.skip, this.pageSize);
  }

  async loadItems(skip: number): Promise<void> {
    this.getVehicles(this.keyWord, skip, this.pageSize);
    console.log(this.vehicles);
    this.gridView = {
      data: this.vehicles,
      total: this.totalVehicles,
    };
  }

  // public dataStateChange(state: DataStateChangeEvent): void {
  //   this.state = state;
  //   this.newservice.query(state);
  // }

  ngOnInit(): void {
    //this.getVehicles(this.keyWord, this.skip, this.pageSize);
    //this.loadItems(this.skip);
    this.webSocketService.listen('notification').subscribe((data: any) => {
      console.log(this.view);
      console.log(data);
      this.notifier.show({
        type: 'success',
        message: data,
      });
      this.getVehicles('', 0, this.pageSize);
    });

    this.view = this.service
      .getVehiclesPagi('', this.skip, this.pageSize)
      .pipe(map((data) => JSON.parse(data)));
    console.log(this.view);
  }

  getVehicles(keyWord: string, skip: number, pageSize: number) {
    //this.spinner.show();
    this.loading = true;
    this.service
      .getVehiclesPagi(keyWord, skip, pageSize)
      .subscribe((result: any) => {
        console.log(result.data.findAllVehiclesPagi.filteredVehicles);
        //console.log(result.loading);
        //console.log(result.data);
        this.loading = result.loading;
        this.vehicles = result.data.findAllVehiclesPagi.filteredVehicles;
        this.totalVehicles = result.data.findAllVehiclesPagi.totalCount;
        this.gridView = {
          data: result.data.findAllVehiclesPagi.filteredVehicles,
          //data: this.testData,
          total: result.data.findAllVehiclesPagi.totalCount,
        };
        console.log(this.gridView);
      });
  }

  public addHandler({ sender }: any) {
    this.closeEditor(sender);

    this.formGroup = new FormGroup({
      id: new FormControl(null),
      make: new FormControl(null, Validators.required),
      model: new FormControl(null),
      engineNumber: new FormControl(
        null,
        Validators.compose([
          Validators.required,
          // Validators.pattern('^[0-9]{1,3}'),
        ])
      ),
      year: new FormControl(null),
    });

    sender.addRow(this.formGroup);
  }
  public editHandler({ sender, rowIndex, dataItem }: any) {
    this.closeEditor(sender);

    this.formGroup = new FormGroup({
      id: new FormControl(dataItem.id),
      make: new FormControl(dataItem.make, Validators.required),
      model: new FormControl(dataItem.model),
      engineNumber: new FormControl(dataItem.engineNumber),
      year: new FormControl(dataItem.year),
    });

    this.editedRowIndex = rowIndex;

    sender.editRow(rowIndex, this.formGroup);
    console.log(this.formGroup.value);
  }
  public cancelHandler({ sender, rowIndex }: any) {
    console.log('Call cancelling...');
    this.closeEditor(sender, rowIndex);
  }
  public saveHandler({ sender, rowIndex, formGroup, isNew }: any) {
    const vehicle: Vehicle = formGroup.value;
    console.log('Call saving...');
    console.log(formGroup.value);
    if (isNew) {
      console.log('Creating Vehicle');
      this.service.createVehicle(formGroup.value);
    } else {
      console.log('Updating Vehicle');
      this.service.updateVehicle(formGroup.value);
    }

    sender.closeRow(rowIndex);
  }

  public removeHandler({ dataItem }: any) {
    console.log('Call removing...');
    console.log(dataItem.id);
    this.service.removeVehicle(dataItem.id);
  }
  private closeEditor(grid: any, rowIndex = this.editedRowIndex) {
    grid.closeRow(rowIndex);
    //this.editService.resetItem(this.editedProduct);
    this.editedRowIndex = undefined;
    this.editedProduct = undefined;
  }

  public filterChange(filter: any): void {
    this.filter = filter;
    // this.gridData = filterBy(sampleProducts, filter);

    if (filter.filters[0] != undefined) {
      //console.log(filter.filters[0]!.value);
      this.keyWord = filter.filters[0]!.value;
    } else {
      console.log('No values');
      this.keyWord = '';
    }
    console.log(this.keyWord);
    this.getVehicles(this.keyWord, this.skip, this.pageSize);
  }

  sendMessage() {
    this.webSocketService.sendMessage('this.newMessage');
  }

  public testData: any[] = [
    {
      __typename: 'Vehicle',
      id: 3,
      make: 'China',
      model: 'Nisan',
      year: 1994,
      engineNumber: 'XXXX',
    },
    {
      __typename: 'Vehicle',
      id: 4,
      make: 'Ford',
      model: 'Escape',
      year: 2017,
      engineNumber: '224324',
    },
    {
      __typename: 'Vehicle',
      id: 5,
      make: 'Nissan',
      model: 'GT-R',
      year: 2015,
      engineNumber: '65757',
    },
    // {
    //   id: 6,
    //   make: 'Mazda',
    //   model: 'Axela',
    //   year: 2020,
    //   engineNumber: '76767',
    // },
    // {
    //   id: 7,
    //   make: 'Toyota',
    //   model: 'Supra',
    //   year: 2019,
    //   engineNumber: '435453',
    // },
  ];
}
